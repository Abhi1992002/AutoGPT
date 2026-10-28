//! Runs backend-docker/run.sh for onboarding and streams its output to the webview.
//! The frontend side is src/onboarding/core/backend-tauri.ts.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use serde::Serialize;
use tauri::ipc::Channel;

const ACTIONS: &[&str] = &["pull", "start", "status", "stop"];
const API_ADDR: &str = "127.0.0.1:8006";

/// GUI apps on macOS start with a bare PATH; Docker usually lives in one of these.
const EXTRA_PATH: &str = "/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin";

fn script_path() -> Result<PathBuf, String> {
    if let Ok(dir) = std::env::var("AUTOGPT_BACKEND_DIR") {
        return Ok(PathBuf::from(dir).join("run.sh"));
    }
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../backend-docker/run.sh");
    if dev.exists() {
        return Ok(dev);
    }
    Err("backend-docker/run.sh not found. Set AUTOGPT_BACKEND_DIR to its folder.".into())
}

/// Runs `run.sh <action>`, sending every stdout and stderr line over `on_line`. Returns the exit code.
#[tauri::command]
pub async fn backend_run(action: String, on_line: Channel<String>) -> Result<i32, String> {
    if !ACTIONS.contains(&action.as_str()) {
        return Err(format!("Unknown backend action: {action}"));
    }
    let script = script_path()?;
    tauri::async_runtime::spawn_blocking(move || run_script(&script, &action, &on_line))
        .await
        .map_err(|e| e.to_string())?
}

fn run_script(script: &Path, action: &str, on_line: &Channel<String>) -> Result<i32, String> {
    let path = format!("{}:{EXTRA_PATH}", std::env::var("PATH").unwrap_or_default());
    let mut child = Command::new("bash")
        .arg(script)
        .arg(action)
        .current_dir(script.parent().unwrap_or(Path::new(".")))
        .env("PATH", path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Could not run {}: {e}", script.display()))?;

    // docker writes pull progress to stderr, so both streams feed the channel
    let stderr = child.stderr.take();
    let err_channel = on_line.clone();
    let err_thread = std::thread::spawn(move || {
        if let Some(stderr) = stderr {
            for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                let _ = err_channel.send(line);
            }
        }
    });
    if let Some(stdout) = child.stdout.take() {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let _ = on_line.send(line);
        }
    }
    let _ = err_thread.join();
    let status = child.wait().map_err(|e| e.to_string())?;
    Ok(status.code().unwrap_or(-1))
}

#[derive(Serialize)]
pub struct Health {
    ok: bool,
    status: u16,
}

/// GET /health on the local API. Done here rather than in the webview, which the API's CORS rules would block.
#[tauri::command]
pub async fn backend_health() -> Result<Health, String> {
    tauri::async_runtime::spawn_blocking(check_health)
        .await
        .map_err(|e| e.to_string())?
}

fn check_health() -> Result<Health, String> {
    let addr: SocketAddr = API_ADDR.parse().map_err(|e| format!("{e}"))?;
    let timeout = Duration::from_millis(2500);
    let mut stream = TcpStream::connect_timeout(&addr, timeout).map_err(|e| e.to_string())?;
    stream.set_read_timeout(Some(timeout)).map_err(|e| e.to_string())?;
    stream
        .write_all(format!("GET /health HTTP/1.1\r\nHost: {API_ADDR}\r\nConnection: close\r\n\r\n").as_bytes())
        .map_err(|e| e.to_string())?;
    let mut head = [0u8; 64];
    let n = stream.read(&mut head).map_err(|e| e.to_string())?;
    let line = String::from_utf8_lossy(&head[..n]);
    let status = line.split_whitespace().nth(1).and_then(|code| code.parse::<u16>().ok()).unwrap_or(0);
    Ok(Health { ok: (200..300).contains(&status), status })
}
