/** The app mark and name, for top bars and sidebars */
export function Brand({ detail }: { detail?: string }) {
  return (
    <span className="ob-brand">
      <img className="ob-brand__mark" src="/brand/app-icon-64.png" alt="" width={20} height={20} />
      <span className="ob-brand__name">AutoGPT</span>
      {detail && <span className="ob-brand__detail">{detail}</span>}
    </span>
  );
}
