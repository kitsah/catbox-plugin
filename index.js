(function($, r, s, h, O, u, j) {
  "use strict";
  async function k(e) {
	try {
	  const t = e ? .item ? .originalUri || e ? .uri || e ? .fileUri || e ? .path || e ? .sourceURL;
	  if (!t) throw new Error("Missing file URI");
	  const a = e.filename ? ? "upload",
		n = r.storage.userhash ? .trim(),
		l = new FormData;
	  l.append("reqtype", "fileupload"), n && l.append("userhash", n), l.append("fileToUpload", {
		uri: t,
		name: a,
		type: e.mimeType ? ? "application/octet-stream"
	  });
	  const o = await (await fetch("https://catbox.moe/user/api.php", {
		method: "POST",
		body: l
	  })).text();
	  if (!o.startsWith("https://")) throw new Error(o);
	  return o
	} catch (t) {
	  return console.error("[CatboxUploader] Upload failed:", t), null
	}
  }
  async function I(e, t = "1h") {
	try {
	  const a = e ? .item ? .originalUri || e ? .uri || e ? .fileUri || e ? .path || e ? .sourceURL;
	  if (!a) throw new Error("Missing file URI");
	  const n = e.filename ? ? "upload",
		l = new FormData;
	  l.append("reqtype", "fileupload"), l.append("time", t), l.append("fileToUpload", {
		uri: a,
		name: n,
		type: e.mimeType ? ? "application/octet-stream"
	  });
	  const o = await (await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
		method: "POST",
		body: l
	  })).text();
	  if (!o.startsWith("https://")) throw new Error(o);
	  return o
	} catch (a) {
	  return console.error("[LitterboxUploader] Upload failed:", a), null
	}
  }

  function q(e, t = 2) {
	if (!+e) return "0 Bytes";
	const a = 1024,
	  n = t < 0 ? 0 : t,
	  l = ["Bytes", "KB", "MB", "GB", "TB"],
	  o = Math.floor(Math.log(e) / Math.log(a));
	return `${parseFloat((e/Math.pow(a,o)).toFixed(n))} ${l[o]}`
  }

  function F(e = 6) {
	const t = "abcdefghijklmnopqrstuvwxyz0123456789";
	let a = "";
	for (let n = 0; n < e; n++) a += t.charAt(Math.floor(Math.random() * t.length));
	return a
  }

  function A(e) {
	return e <= 3 ? 1 : e <= 15 ? 12 : e <= 27 ? 24 : 72
  }

  function G() {
	const e = `warmup_${F()}.bin`,
	  t = Math.floor(Math.random() * 1048576) + 1;
	return {
	  uri: "data:application/octet-stream;base64,AA==",
	  filename: e,
	  mimeType: "application/octet-stream",
	  preCompressionSize: t
	}
  }

  function _() {
	setTimeout(async function() {
	  const e = G();
	  try {
		const t = await k(e);
		console.log(`[WarmUp] Catbox upload complete: ${t}`)
	  } catch (t) {
		console.warn("[WarmUp] Catbox upload failed:", t)
	  }
	  try {
		const t = await I(e, "1h");
		console.log(`[WarmUp] Litterbox upload complete: ${t}`)
	  } catch (t) {
		console.warn("[WarmUp] Litterbox upload failed:", t)
	  }
	}, 0)
  }
  const {
	ScrollView: K
  } = h.findByProps("ScrollView"), {
	TableRowGroup: m,
	TableSwitchRow: p,
	Stack: U
  } = h.findByProps("TableSwitchRow", "TableRowGroup", "Stack"), {
	TextInput: P
  } = h.findByProps("TextInput"), i = function(e, t = "") {
	return r.storage[e] ? ? t
  }, c = function(e, t) {
	return r.storage[e] = t
  };

  function D() {
	const [e, t] = s.React.useReducer(function(o) {
	  return ~o
	}, 0), a = function() {
	  return t()
	}, n = i("selectedHost", "catbox"), l = function(o) {
	  c("selectedHost", o), a()
	};
	return s.React.createElement(K, {
	  style: {
		flex: 1
	  }
	}, s.React.createElement(U, {
	  spacing: 8,
	  style: {
		padding: 10
	  }
	}, s.React.createElement(m, {
	  title: "Upload Settings"
	}, s.React.createElement(p, {
	  label: "Always upload to file hosters",
	  subLabel: "Ignore the 10MBs file size limit to trigger upload",
	  value: !!i("alwaysUpload"),
	  onValueChange: function(o) {
		c("alwaysUpload", o), a()
	  }
	}), s.React.createElement(p, {
	  label: "Copy link to clipboard",
	  subLabel: "Disable to automatically send link to chat",
	  value: !!i("copy"),
	  onValueChange: function(o) {
		c("copy", o), a()
	  }
	}), s.React.createElement(p, {
	  label: "Insert into the message",
	  subLabel: "Directly inserts the link at the end of the next message",
	  value: !!i("insert"),
	  onValueChange: function(o) {
		c("insert", o), a()
	  }
	})), s.React.createElement(m, {
	  title: "Default File Hoster"
	}, s.React.createElement(p, {
	  label: "Catbox",
	  subLabel: "https://catbox.moe/",
	  value: n === "catbox",
	  onValueChange: function() {
		return l("catbox")
	  }
	}), s.React.createElement(p, {
	  label: "Litterbox",
	  subLabel: "https://litterbox.catbox.moe/",
	  value: n === "litterbox",
	  onValueChange: function() {
		return l("litterbox")
	  }
	}), s.React.createElement(p, {
	  label: "Pomf",
	  subLabel: "https://pomf.lain.la/",
	  value: n === "pomf",
	  onValueChange: function() {
		return l("pomf")
	  }
	})), s.React.createElement(m, {
	  title: "Litterbox default duration(hours)"
	}, s.React.createElement(U, {
	  spacing: 4
	}, s.React.createElement(P, {
	  placeholder: "e.g. 24",
	  value: i("defaultDuration"),
	  onChange: function(o) {
		c("defaultDuration", o), a()
	  },
	  isClearable: !0
	}))), s.React.createElement(m, {
	  title: "Litterbox Custom Command Name"
	}, s.React.createElement(U, {
	  spacing: 4
	}, s.React.createElement(P, {
	  placeholder: "e.g. /litterbox",
	  value: i("commandName"),
	  onChange: function(o) {
		c("commandName", o), a()
	  },
	  isClearable: !0
	}))), s.React.createElement(m, {
	  title: "Proxy Settings"
	}, s.React.createElement(p, {
	  label: "Use Proxy Server",
	  value: !!i("useProxy"),
	  onValueChange: function(o) {
		c("useProxy", o), a()
	  }
	}), s.React.createElement(p, {
	  label: "Reverse proxied link",
	  value: !!i("revProxy"),
	  onValueChange: function(o) {
		c("revProxy", o), a()
	  }
	})), s.React.createElement(m, {
	  title: "Proxy Base URL"
	}, s.React.createElement(U, {
	  spacing: 4
	}, s.React.createElement(P, {
	  placeholder: "https://your-proxy.com",
	  value: i("proxyBaseUrl"),
	  onChange: function(o) {
		const y = o.replace(/\/+$/, "");
		c("proxyBaseUrl", y), a()
	  },
	  isClearable: !0
	}))), s.React.createElement(m, {
	  title: "Catbox Userhash"
	}, s.React.createElement(U, {
	  spacing: 4
	}, s.React.createElement(P, {
	  placeholder: "Userhash",
	  value: i("userhash"),
	  onChange: function(o) {
		c("userhash", o), a()
	  },
	  isClearable: !0
	})))))
  }
  let L = null;

  function J(e) {
	L = e
  }

  function Q() {
	const e = L;
	return L = null, e
  }
  let v = null;

  function X() {
	if (v) return;
	const e = (r.storage.commandName || "litterbox").replace(/^\//, "");
	v = O.registerCommand({
	  name: e,
	  description: "Set Litterbox duration for the next upload (in hours)",
	  options: [{
		name: "duration",
		description: "Duration (e.g., 1, 12, 24, 72)",
		type: 3,
		required: !1
	  }],
	  execute(t) {
		const a = t[0] ? .value ? ? "",
		  n = parseInt(a);
		if (isNaN(n)) return;
		const l = A(n);
		J(`${l}h`), u.showToast(`Duration set to ${l}h for the next upload.`)
	  }
	}), console.log(`[catbox.moe] Registered /${e} command`)
  }

  function Y() {
	v ? .(), v = null
  }
  async function Z(e) {
	try {
	  const t = e ? .item ? .originalUri || e ? .uri || e ? .fileUri || e ? .path || e ? .sourceURL;
	  if (!t) throw new Error("Missing file URI");
	  const a = e.filename ? ? "upload",
		n = new FormData;
	  n.append("files[]", {
		uri: t,
		name: a,
		type: e.mimeType ? ? "application/octet-stream"
	  });
	  const l = await (await fetch("https://pomf.lain.la/upload.php", {
		method: "POST",
		body: n
	  })).json();
	  if (!l ? .success) throw new Error(l ? .error ? ? "Unknown error");
	  const o = l ? .files ? . [0];
	  if (!o ? .url) throw new Error("No URL returned from Pomf");
	  return o.url
	} catch (t) {
	  return console.error("[PomfUploader] Upload failed:", t), null
	}
  }
  async function ee(e, {
	uploadId: t = F(8),
	filename: a,
	proxyBaseUrl: n,
	userhash: l,
	destination: o,
	duration: y = "1h",
	revProxy: N = D.revProxy
  }) {
	try {
	  const C = e ? .item ? .originalUri || e ? .uri || e ? .fileUri || e ? .path || e ? .sourceURL;
	  if (!C) throw new Error("Missing file URI");
	  const d = new FormData;
	  d.append("destination", o), d.append("time", y), l && d.append("userhash", l), d.append("file", {
		uri: C,
		name: a,
		type: e.mimeType ? ? "application/octet-stream"
	  });
	  const b = await fetch(`${n}/direct`, {
		  method: "POST",
		  body: d
		}),
		g = await b.json();
	  if (!b.ok || !g ? .url) throw new Error(g ? .error ? ? "Unknown upload error");
	  if (N) try {
		const R = new URL(g.url).pathname.split("/").pop();
		return `${n}/${o}/${R}`
	  } catch {
		return g.url
	  }
	  return g.url
	} catch {
	  return null
	}
  }
  const M = h.findByProps("CloudUpload") ? .CloudUpload,
	B = h.findByProps("sendMessage"),
	te = h.findByProps("getChannelId"),
	V = h.findByProps("getPendingMessages", "deletePendingMessage");

  function ae() {
	typeof r.storage.alwaysUpload != "boolean" && (r.storage.alwaysUpload = !1), typeof r.storage.copy != "boolean" && (r.storage.copy = !0), typeof r.storage.useProxy != "boolean" && (r.storage.useProxy = !1), typeof r.storage.proxyBaseUrl != "string" && (r.storage.proxyBaseUrl = "https://fatboxog.onrender.com"), (typeof r.storage.defaultDuration != "string" || !/^\d+$/.test(r.storage.defaultDuration)) && (r.storage.defaultDuration = "1"), typeof r.storage.commandName != "string" && (r.storage.commandName = "/litterbox"), ["catbox", "litterbox", "pomf"].includes(r.storage.selectedHost) || (r.storage.selectedHost = "catbox"), typeof r.storage.insert != "boolean" && (r.storage.insert = !1)
  }

  function W(e) {
	try {
	  const t = V ? .getPendingMessages ? .(e);
	  if (!t) return;
	  for (const [a, n] of Object.entries(t)) n.state === "FAILED" && (V.deletePendingMessage(e, a), console.log(`[catbox.moe] Deleted failed message: ${a}`))
	} catch (t) {
	  console.warn("[catbox.moe] Failed to delete pending messages:", t)
	}
  }
  let T = null;

  function oe() {
	return j.before("sendMessage", B, function(e) {
	  const t = e[1];
	  return r.storage.insert && T && t ? .content && (t.content = `${t.content}
${T}`, T = null), e
	})
  }

  function re() {
	const e = M.prototype.reactNativeCompressAndExtractData;
	return M.prototype.reactNativeCompressAndExtractData = async function(...t) {
		const a = this,
		  n = a ? .preCompressionSize ? ? 0,
		  l = q(n);
		if (n > 1024 * 1024 * 1024) return u.showToast("❌ File too large (max 1 GB)"), null;
		const o = !!r.storage.alwaysUpload,
		  y = !!r.storage.insert,
		  N = !!r.storage.copy,
		  C = !!r.storage.useProxy;
		r.storage.revProxy;
		const d = r.storage.selectedHost || "catbox";
		if (!(o || n > 10 * 1024 * 1024)) return e.apply(this, t);
		this.preCompressionSize = 1337;
		let b = Q();
		const g = b !== null;
		b || (b = r.storage.defaultDuration || "1");
		let R = parseInt(b);
		isNaN(R) && (R = 1);
		const z = `${A(R)}h`,
		  se = n > 200 * 1024 * 1024;
		let x = "catbox";
		g ? x = "litterbox" : se ? x = d === "catbox" ? "litterbox" : d : x = d;
		const H = x.charAt(0).toUpperCase() + x.slice(1),
		  le = C ? `proxied ${H}` : H;
		u.showToast(`\u{1F4E4} Uploading ${l} to ${le}...`);
		let w = this ? .channelId ? ? te ? .getChannelId ? .();
		try {
		  let f = null;
		  if (C) {
			const E = r.storage.proxyBaseUrl ? .trim() || "";
			f = await ee(a, {
			  filename: a ? .filename ? ? "upload",
			  proxyBaseUrl: E,
			  userhash: r.storage.userhash,
			  destination: x,
			  duration: z,
			  revProxy: r.storage.revProxy
			})
		  } else switch (x) {
			case "litterbox":
			  f = await I(a, z);
			  break;
			case "pomf":
			  f = await Z(a);
			  break;
			default:
			  f = await k(a)
		  }
		  if (typeof this.setStatus == "function" && this.setStatus("CANCELED"), w && setTimeout(function() {
			  return W(w)
			}, 500), f) {
			const E = `[${a?.filename??"file"}](${f})`;
			y && (T = E, u.showToast("Link will be inserted to your next message.")), N ? (s.ReactNative.Clipboard.setString(E), u.showToast("Copied to clipboard!")) : !y && w && B ? .sendMessage ? (await B.sendMessage(w, {
			  content: E
			}), u.showToast("Link sent to chat.")) : y || u.showToast("Upload succeeded but could not send link.")
		  } else console.warn("[Uploader] Upload failed, no link returned."), u.showToast("Upload failed.")
		} catch (f) {
		  console.error("[Uploader] Upload error:", f), u.showToast("Upload error occurred."), w && setTimeout(function() {
			return W(w)
		  }, 500)
		}
		return null
	  },
	  function() {
		M.prototype.reactNativeCompressAndExtractData = e
	  }
  }
  let S = [];
  var ne = {
	onLoad() {
	  ae(), X(), S.push(re()), S.push(oe()), _(), console.log("[catbox.moe] Plugin loaded."), this.settings = D
	},
	onUnload() {
	  Y(), S.forEach(function(e) {
		return e()
	  }), console.log("[catbox.moe] Plugin unloaded.")
	},
	settings: D
  };
  return $.default = ne, Object.defineProperty($, "__esModule", {
	value: !0
  }), $
})({}, vendetta.plugin, vendetta.metro.common, vendetta.metro, vendetta.commands, vendetta.ui.toasts, vendetta.patcher);