import { useEffect, useState } from "react";
import { OtpInput, type OtpStatus } from "../../design-system/components/otp-input";
import { Row } from "./Row";
import { Block } from "./Block";

function ErrorDemo() {
  const [status, setStatus] = useState<OtpStatus>("idle");
  useEffect(() => {
    const t = window.setTimeout(() => setStatus("error"), 300);
    return () => clearTimeout(t);
  }, []);
  return <OtpInput defaultValue="482913" status={status} clearOnError={false} onResend={() => {}} resendIn={0} />;
}

function InteractiveDemo() {
  const [status, setStatus] = useState<OtpStatus>("idle");
  useEffect(() => {
    if (status !== "verifying") return;
    const t = window.setTimeout(() => setStatus("error"), 1200);
    return () => clearTimeout(t);
  }, [status]);
  return (
    <OtpInput
      separator
      status={status}
      onComplete={() => setStatus("verifying")}
      onChange={() => status === "error" && setStatus("idle")}
      onResend={() => {}}
      resendIn={30}
    />
  );
}

export function OtpInputBlock() {
  return (
    <Block
      source="affectui"
      title="OTP Input"
      description="The verification code field – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified."
    >
      <Row label="Interactive" layout="wide">
        <div className="row__block">
          <InteractiveDemo />
        </div>
      </Row>
      <Row label="Partly filled" layout="wide">
        <div className="row__block">
          <OtpInput defaultValue="48" />
        </div>
        <div className="row__block">
          <OtpInput defaultValue="48" separator align="center" />
        </div>
      </Row>
      <Row label="Verifying" layout="wide">
        <div className="row__block">
          <OtpInput defaultValue="482913" status="verifying" />
        </div>
      </Row>
      <Row label="Error" layout="wide">
        <div className="row__block">
          <ErrorDemo />
        </div>
      </Row>
      <Row label="Success" layout="wide">
        <div className="row__block">
          <OtpInput defaultValue="482913" status="success" onResend={() => {}} />
        </div>
      </Row>
      <Row label="Alphanumeric" layout="wide">
        <div className="row__block">
          <OtpInput numeric={false} length={8} separator={4} defaultValue="A7KQ" />
        </div>
      </Row>
      <Row label="Disabled" layout="wide">
        <div className="row__block">
          <OtpInput defaultValue="4829" disabled />
        </div>
      </Row>
    </Block>
  );
}
