"use client";

import { useState } from "react";

export function AdminPasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      登录密码
      <span className="admin-password-row">
        <input name="password" type={visible ? "text" : "password"} required />
        <button type="button" onClick={() => setVisible((value) => !value)}>
          {visible ? "隐藏" : "显示"}
        </button>
      </span>
    </label>
  );
}
