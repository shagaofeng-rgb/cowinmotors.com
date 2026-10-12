"use client";

export default function AdminDataError({ reset }: { error: Error; reset: () => void }) {
  return <div className="admin-page"><header className="admin-page-head"><div><p className="eyebrow">数据读取失败</p><h1>暂时无法显示后台数据</h1><p>当前数据源未能完成查询，因此没有显示可能不准确的统计结果。请稍后重试。</p></div></header><div className="admin-alert" role="alert">如果问题持续，请检查数据库或第三方数据连接。</div><button className="admin-primary-button" type="button" onClick={reset}>重新加载</button></div>;
}
