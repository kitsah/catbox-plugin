(function(exports, plugin, metroCommon, metro, commands, toasts, patcher) {
	"use strict";

	// ============================================
	// File Upload Functions
	// ============================================

	/**
	 * Upload file to Catbox.moe
	 * @param {Object} fileData - File data object containing URI and metadata
	 * @returns {Promise<string|null>} Upload URL or null if failed
	 */
	async function uploadToCatbox(fileData) {
		try {
			const fileUri = fileData?.item?.originalUri || 
						   fileData?.uri || 
						   fileData?.fileUri || 
						   fileData?.path || 
						   fileData?.sourceURL;
			
			if (!fileUri) throw new Error("Missing file URI");
			
			const filename = fileData.filename ?? "upload";
			const userHash = plugin.storage.userhash?.trim();
			const formData = new FormData();
			
			formData.append("reqtype", "fileupload");
			if (userHash) {
				formData.append("userhash", userHash);
			}
			formData.append("fileToUpload", {
				uri: fileUri,
				name: filename,
				type: fileData.mimeType ?? "application/octet-stream"
			});
			
			const response = await fetch("https://catbox.moe/user/api.php", {
				method: "POST",
				body: formData
			});
			const responseText = await response.text();
			
			if (!responseText.startsWith("https://")) {
				throw new Error(responseText);
			}
			
			return responseText;
		} catch (error) {
			console.error("[CatboxUploader] Upload failed:", error);
			return null;
		}
	}

	/**
	 * Upload file to Litterbox (temporary hosting)
	 * @param {Object} fileData - File data object
	 * @param {string} duration - Duration like "1h", "12h", "24h", "72h"
	 * @returns {Promise<string|null>} Upload URL or null if failed
	 */
	async function uploadToLitterbox(fileData, duration = "1h") {
		try {
			const fileUri = fileData?.item?.originalUri || 
						   fileData?.uri || 
						   fileData?.fileUri || 
						   fileData?.path || 
						   fileData?.sourceURL;
			
			if (!fileUri) throw new Error("Missing file URI");
			
			const filename = fileData.filename ?? "upload";
			const formData = new FormData();
			
			formData.append("reqtype", "fileupload");
			formData.append("time", duration);
			formData.append("fileToUpload", {
				uri: fileUri,
				name: filename,
				type: fileData.mimeType ?? "application/octet-stream"
			});
			
			const response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
				method: "POST",
				body: formData
			});
			const responseText = await response.text();
			
			if (!responseText.startsWith("https://")) {
				throw new Error(responseText);
			}
			
			return responseText;
		} catch (error) {
			console.error("[LitterboxUploader] Upload failed:", error);
			return null;
		}
	}

	/**
	 * Upload file to Pomf.lain.la
	 * @param {Object} fileData - File data object
	 * @returns {Promise<string|null>} Upload URL or null if failed
	 */
	async function uploadToPomf(fileData) {
		try {
			const fileUri = fileData?.item?.originalUri || 
						   fileData?.uri || 
						   fileData?.fileUri || 
						   fileData?.path || 
						   fileData?.sourceURL;
			
			if (!fileUri) throw new Error("Missing file URI");
			
			const filename = fileData.filename ?? "upload";
			const formData = new FormData();
			
			formData.append("files[]", {
				uri: fileUri,
				name: filename,
				type: fileData.mimeType ?? "application/octet-stream"
			});
			
			const response = await fetch("https://pomf.lain.la/upload.php", {
				method: "POST",
				body: formData
			});
			const jsonResponse = await response.json();
			
			if (!jsonResponse?.success) {
				throw new Error(jsonResponse?.error ?? "Unknown error");
			}
			
			const uploadedFile = jsonResponse?.files?.[0];
			if (!uploadedFile?.url) {
				throw new Error("No URL returned from Pomf");
			}
			
			return uploadedFile.url;
		} catch (error) {
			console.error("[PomfUploader] Upload failed:", error);
			return null;
		}
	}

	/**
	 * Upload file through proxy server
	 * @param {Object} fileData - File data object
	 * @param {Object} options - Upload options
	 * @returns {Promise<string|null>} Upload URL or null if failed
	 */
	async function uploadThroughProxy(fileData, {
		uploadId = generateRandomString(8),
		filename,
		proxyBaseUrl,
		userhash,
		destination,
		duration = "1h",
		revProxy = SettingsComponent.revProxy
	}) {
		try {
			const fileUri = fileData?.item?.originalUri || 
						   fileData?.uri || 
						   fileData?.fileUri || 
						   fileData?.path || 
						   fileData?.sourceURL;
			
			if (!fileUri) throw new Error("Missing file URI");
			
			const formData = new FormData();
			formData.append("destination", destination);
			formData.append("time", duration);
			if (userhash) {
				formData.append("userhash", userhash);
			}
			formData.append("file", {
				uri: fileUri,
				name: filename,
				type: fileData.mimeType ?? "application/octet-stream"
			});
			
			const response = await fetch(`${proxyBaseUrl}/direct`, {
				method: "POST",
				body: formData
			});
			const jsonResponse = await response.json();
			
			if (!response.ok || !jsonResponse?.url) {
				throw new Error(jsonResponse?.error ?? "Unknown upload error");
			}
			
			if (revProxy) {
				try {
					const fileId = new URL(jsonResponse.url).pathname.split("/").pop();
					return `${proxyBaseUrl}/${destination}/${fileId}`;
				} catch {
					return jsonResponse.url;
				}
			}
			
			return jsonResponse.url;
		} catch {
			return null;
		}
	}

	// ============================================
	// Utility Functions
	// ============================================

	/**
	 * Format bytes to human readable string
	 * @param {number} bytes - Size in bytes
	 * @param {number} decimals - Number of decimal places
	 * @returns {string} Formatted size string
	 */
	function formatBytes(bytes, decimals = 2) {
		if (!+bytes) return "0 Bytes";
		
		const kilobyte = 1024;
		const decimalPlaces = decimals < 0 ? 0 : decimals;
		const units = ["Bytes", "KB", "MB", "GB", "TB"];
		const unitIndex = Math.floor(Math.log(bytes) / Math.log(kilobyte));
		
		return `${parseFloat((bytes / Math.pow(kilobyte, unitIndex)).toFixed(decimalPlaces))} ${units[unitIndex]}`;
	}

	/**
	 * Generate random alphanumeric string
	 * @param {number} length - Length of string to generate
	 * @returns {string} Random string
	 */
	function generateRandomString(length = 6) {
		const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		
		return result;
	}

	/**
	 * Get duration in hours based on input
	 * Maps user input to valid Litterbox durations
	 * @param {number} inputHours - Input hours
	 * @returns {number} Valid duration (1, 12, 24, or 72)
	 */
	function getDurationHours(inputHours) {
		if (inputHours <= 3) return 1;
		if (inputHours <= 15) return 12;
		if (inputHours <= 27) return 24;
		return 72;
	}

	/**
	 * Generate warmup file data for testing
	 * @returns {Object} Mock file data
	 */
	function generateWarmupFile() {
		const filename = `warmup_${generateRandomString()}.bin`;
		const randomSize = Math.floor(Math.random() * 1048576) + 1;
		
		return {
			uri: "data:application/octet-stream;base64,AA==",
			filename: filename,
			mimeType: "application/octet-stream",
			preCompressionSize: randomSize
		};
	}

	/**
	 * Perform warmup uploads to test services
	 */
	function performWarmupUploads() {
		setTimeout(async function() {
			const warmupFile = generateWarmupFile();
			
			try {
				const catboxUrl = await uploadToCatbox(warmupFile);
				console.log(`[WarmUp] Catbox upload complete: ${catboxUrl}`);
			} catch (error) {
				console.warn("[WarmUp] Catbox upload failed:", error);
			}
			
			try {
				const litterboxUrl = await uploadToLitterbox(warmupFile, "1h");
				console.log(`[WarmUp] Litterbox upload complete: ${litterboxUrl}`);
			} catch (error) {
				console.warn("[WarmUp] Litterbox upload failed:", error);
			}
		}, 0);
	}

	// ============================================
	// Storage Helpers
	// ============================================

	/**
	 * Get value from storage
	 * @param {string} key - Storage key
	 * @param {any} defaultValue - Default value if key not found
	 * @returns {any} Stored value or default
	 */
	const getStorageValue = function(key, defaultValue = "") {
		return plugin.storage[key] ?? defaultValue;
	};

	/**
	 * Set value in storage
	 * @param {string} key - Storage key
	 * @param {any} value - Value to store
	 * @returns {any} Stored value
	 */
	const setStorageValue = function(key, value) {
		return plugin.storage[key] = value;
	};

	// ============================================
	// React Components
	// ============================================

	// Extract React Native components from metro
	const { ScrollView } = metro.findByProps("ScrollView");
	const { TableRowGroup, TableSwitchRow, Stack } = metro.findByProps("TableSwitchRow", "TableRowGroup", "Stack");
	const { TextInput } = metro.findByProps("TextInput");

	/**
	 * Settings component for plugin configuration
	 */
	function SettingsComponent() {
		const [refreshKey, forceRefresh] = metroCommon.React.useReducer(function(state) {
			return ~state;
		}, 0);
		
		const triggerRefresh = function() {
			return forceRefresh();
		};
		
		const selectedHost = getStorageValue("selectedHost", "catbox");
		const setSelectedHost = function(host) {
			setStorageValue("selectedHost", host);
			triggerRefresh();
		};
		
		return metroCommon.React.createElement(ScrollView, { style: { flex: 1 } },
			metroCommon.React.createElement(Stack, { spacing: 8, style: { padding: 10 } },
				
				// Upload Settings Section
				metroCommon.React.createElement(TableRowGroup, { title: "Upload Settings" },
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Always upload to file hosters",
						subLabel: "Ignore the 10MBs file size limit to trigger upload",
						value: !!getStorageValue("alwaysUpload"),
						onValueChange: function(value) {
							setStorageValue("alwaysUpload", value);
							triggerRefresh();
						}
					}),
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Copy link to clipboard",
						subLabel: "Disable to automatically send link to chat",
						value: !!getStorageValue("copy"),
						onValueChange: function(value) {
							setStorageValue("copy", value);
							triggerRefresh();
						}
					}),
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Insert into the message",
						subLabel: "Directly inserts the link at the end of the next message",
						value: !!getStorageValue("insert"),
						onValueChange: function(value) {
							setStorageValue("insert", value);
							triggerRefresh();
						}
					})
				),
				
				// Default File Hoster Section
				metroCommon.React.createElement(TableRowGroup, { title: "Default File Hoster" },
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Catbox",
						subLabel: "https://catbox.moe/",
						value: selectedHost === "catbox",
						onValueChange: function() {
							return setSelectedHost("catbox");
						}
					}),
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Litterbox",
						subLabel: "https://litterbox.catbox.moe/",
						value: selectedHost === "litterbox",
						onValueChange: function() {
							return setSelectedHost("litterbox");
						}
					}),
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Pomf",
						subLabel: "https://pomf.lain.la/",
						value: selectedHost === "pomf",
						onValueChange: function() {
							return setSelectedHost("pomf");
						}
					})
				),
				
				// Litterbox Duration Setting
				metroCommon.React.createElement(TableRowGroup, { title: "Litterbox default duration(hours)" },
					metroCommon.React.createElement(Stack, { spacing: 4 },
						metroCommon.React.createElement(TextInput, {
							placeholder: "e.g. 24",
							value: getStorageValue("defaultDuration"),
							onChange: function(value) {
								setStorageValue("defaultDuration", value);
								triggerRefresh();
							},
							isClearable: true
						})
					)
				),
				
				metroCommon.React.createElement(TableRowGroup, { title: "File upload threshold (megabytes)" },
					metroCommon.React.createElement(Stack, { spacing: 4 },
						metroCommon.React.createElement(TextInput, {
							placeholder: "e.g. 10",
							value: getStorageValue("fileThreshold"),
							onChange: function(value) {
								setStorageValue("fileThreshold", value);
								triggerRefresh();
							},
							isClearable: true
						})
					)
				),
				
				// Custom Command Name
				metroCommon.React.createElement(TableRowGroup, { title: "Litterbox Custom Command Name" },
					metroCommon.React.createElement(Stack, { spacing: 4 },
						metroCommon.React.createElement(TextInput, {
							placeholder: "e.g. /litterbox",
							value: getStorageValue("commandName"),
							onChange: function(value) {
								setStorageValue("commandName", value);
								triggerRefresh();
							},
							isClearable: true
						})
					)
				),
				
				// Proxy Settings
				metroCommon.React.createElement(TableRowGroup, { title: "Proxy Settings" },
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Use Proxy Server",
						value: !!getStorageValue("useProxy"),
						onValueChange: function(value) {
							setStorageValue("useProxy", value);
							triggerRefresh();
						}
					}),
					metroCommon.React.createElement(TableSwitchRow, {
						label: "Reverse proxied link",
						value: !!getStorageValue("revProxy"),
						onValueChange: function(value) {
							setStorageValue("revProxy", value);
							triggerRefresh();
						}
					})
				),
				
				// Proxy URL Setting
				metroCommon.React.createElement(TableRowGroup, { title: "Proxy Base URL" },
					metroCommon.React.createElement(Stack, { spacing: 4 },
						metroCommon.React.createElement(TextInput, {
							placeholder: "https://your-proxy.com",
							value: getStorageValue("proxyBaseUrl"),
							onChange: function(value) {
								const cleanUrl = value.replace(/\/+$/, "");
								setStorageValue("proxyBaseUrl", cleanUrl);
								triggerRefresh();
							},
							isClearable: true
						})
					)
				),
				
				// Catbox Userhash
				metroCommon.React.createElement(TableRowGroup, { title: "Catbox Userhash" },
					metroCommon.React.createElement(Stack, { spacing: 4 },
						metroCommon.React.createElement(TextInput, {
							placeholder: "Userhash",
							value: getStorageValue("userhash"),
							onChange: function(value) {
								setStorageValue("userhash", value);
								triggerRefresh();
							},
							isClearable: true
						})
					)
				)
			)
		);
	}

	// ============================================
	// Command Management
	// ============================================

	let pendingDuration = null;
	
	function setPendingDuration(duration) {
		pendingDuration = duration;
	}
	
	function getPendingDuration() {
		const duration = pendingDuration;
		pendingDuration = null;
		return duration;
	}

	let registeredCommand = null;

	/**
	 * Register the slash command for Litterbox duration
	 */
	function registerLitterboxCommand() {
		if (registeredCommand) return;
		
		const commandName = (plugin.storage.commandName || "litterbox").replace(/^\//, "");
		
		registeredCommand = commands.registerCommand({
			name: commandName,
			description: "Set Litterbox duration for the next upload (in hours)",
			options: [{
				name: "duration",
				description: "Duration (e.g., 1, 12, 24, 72)",
				type: 3,
				required: false
			}],
			execute(args) {
				const durationInput = args[0]?.value ?? "";
				const hours = parseInt(durationInput);
				
				if (isNaN(hours)) return;
				
				const validDuration = getDurationHours(hours);
				setPendingDuration(`${validDuration}h`);
				toasts.showToast(`Duration set to ${validDuration}h for the next upload.`);
			}
		});
		
		console.log(`[catbox.moe] Registered /${commandName} command`);
	}

	/**
	 * Unregister the slash command
	 */
	function unregisterLitterboxCommand() {
		registeredCommand?.();
		registeredCommand = null;
	}

	// ============================================
	// Discord Integration
	// ============================================

	const CloudUploadClass = metro.findByProps("CloudUpload")?.CloudUpload;
	const MessageSender = metro.findByProps("sendMessage");
	const ChannelStore = metro.findByProps("getChannelId");
	const PendingMessageManager = metro.findByProps("getPendingMessages", "deletePendingMessage");

	/**
	 * Initialize default storage values
	 */
	function initializeDefaultSettings() {
		if (typeof plugin.storage.alwaysUpload !== "boolean") {
			plugin.storage.alwaysUpload = false;
		}
		if (typeof plugin.storage.copy !== "boolean") {
			plugin.storage.copy = true;
		}
		if (typeof plugin.storage.useProxy !== "boolean") {
			plugin.storage.useProxy = false;
		}
		if (typeof plugin.storage.proxyBaseUrl !== "string") {
			plugin.storage.proxyBaseUrl = "https://fatboxog.onrender.com";
		}
		if (typeof plugin.storage.defaultDuration !== "string" || !/^\d+$/.test(plugin.storage.defaultDuration)) {
			plugin.storage.defaultDuration = "1";
		}
		if (typeof plugin.storage.fileThreshold !== "string" || !/^\d+$/.test(plugin.storage.fileThreshold)) {
			plugin.storage.fileThreshold = "10";
		}
		if (typeof plugin.storage.commandName !== "string") {
			plugin.storage.commandName = "/litterbox";
		}
		if (!["catbox", "litterbox", "pomf"].includes(plugin.storage.selectedHost)) {
			plugin.storage.selectedHost = "catbox";
		}
		if (typeof plugin.storage.insert !== "boolean") {
			plugin.storage.insert = false;
		}
	}

	/**
	 * Delete failed pending messages
	 * @param {string} channelId - Channel ID
	 */
	function deleteFailedMessages(channelId) {
		try {
			const pendingMessages = PendingMessageManager?.getPendingMessages?.(channelId);
			if (!pendingMessages) return;
			
			for (const [messageId, message] of Object.entries(pendingMessages)) {
				if (message.state === "FAILED") {
					PendingMessageManager.deletePendingMessage(channelId, messageId);
					console.log(`[catbox.moe] Deleted failed message: ${messageId}`);
				}
			}
		} catch (error) {
			console.warn("[catbox.moe] Failed to delete pending messages:", error);
		}
	}

	let pendingInsertLink = null;

	/**
	 * Patch sendMessage to insert link into message
	 */
	function patchSendMessage() {
		return patcher.before("sendMessage", MessageSender, function(args) {
			const messageData = args[1];
			
			if (plugin.storage.insert && pendingInsertLink && messageData?.content) {
				messageData.content = `${messageData.content}\n${pendingInsertLink}`;
				pendingInsertLink = null;
			}
			
			return args;
		});
	}

	/**
	 * Patch the file upload handler
	 */
	function patchFileUploadHandler() {
		const originalCompress = CloudUploadClass.prototype.reactNativeCompressAndExtractData;
		
		CloudUploadClass.prototype.reactNativeCompressAndExtractData = async function(...args) {
			const fileInstance = this;
			const fileSize = fileInstance?.preCompressionSize ?? 0;
			const formattedSize = formatBytes(fileSize);
			
			// Check file size limit (1 GB)
			if (fileSize > 1024 * 1024 * 1024) {
				toasts.showToast("❌ File too large (max 1 GB)");
				return null;
			}
			
			// Get settings
			const alwaysUpload = !!plugin.storage.alwaysUpload;
			const insertToMessage = !!plugin.storage.insert;
			const copyToClipboard = !!plugin.storage.copy;
			const useProxy = !!plugin.storage.useProxy;
			const selectedHost = plugin.storage.selectedHost || "catbox";
			const fileThreshold = parseInt(plugin.storage.fileThreshold);
			
			// Check if we should handle this upload
			if (!(alwaysUpload || fileSize > fileThreshold * 1024 * 1024)) {
				return originalCompress.apply(this, args);
			}
			
			// Prevent Discord's default upload
			this.preCompressionSize = 1337;
			
			// Get duration settings
			let duration = getPendingDuration();
			const hasCustomDuration = duration !== null;
			
			if (!duration) {
				duration = plugin.storage.defaultDuration || "1";
			}
			
			let durationHours = parseInt(duration);
			if (isNaN(durationHours)) {
				durationHours = 1;
			}
			
			const finalDuration = `${getDurationHours(durationHours)}h`;
			
			// Determine upload destination
			const isLargeFile = fileSize > 200 * 1024 * 1024;
			let uploadDestination = "catbox";
			
			if (hasCustomDuration) {
				uploadDestination = "litterbox";
			} else if (isLargeFile) {
				uploadDestination = selectedHost === "catbox" ? "litterbox" : selectedHost;
			} else {
				uploadDestination = selectedHost;
			}
			
			const destinationName = uploadDestination.charAt(0).toUpperCase() + uploadDestination.slice(1);
			const displayName = useProxy ? `proxied ${destinationName}` : destinationName;
			
			toasts.showToast(`📤 Uploading ${formattedSize} to ${displayName}...`);
			
			let channelId = this?.channelId ?? ChannelStore?.getChannelId?.();
			
			try {
				let uploadUrl = null;
				
				if (useProxy) {
					const proxyUrl = plugin.storage.proxyBaseUrl?.trim() || "";
					uploadUrl = await uploadThroughProxy(fileInstance, {
						filename: fileInstance?.filename ?? "upload",
						proxyBaseUrl: proxyUrl,
						userhash: plugin.storage.userhash,
						destination: uploadDestination,
						duration: finalDuration,
						revProxy: plugin.storage.revProxy
					});
				} else {
					switch (uploadDestination) {
						case "litterbox":
							uploadUrl = await uploadToLitterbox(fileInstance, finalDuration);
							break;
						case "pomf":
							uploadUrl = await uploadToPomf(fileInstance);
							break;
						default:
							uploadUrl = await uploadToCatbox(fileInstance);
					}
				}
				
				// Cancel Discord's upload
				if (typeof this.setStatus === "function") {
					this.setStatus("CANCELED");
				}
				
				// Clean up failed messages
				if (channelId) {
					setTimeout(function() {
						return deleteFailedMessages(channelId);
					}, 500);
				}
				
				if (uploadUrl) {
					const markdownLink = `[${fileInstance?.filename ?? "file"}](${uploadUrl})`;
					
					if (insertToMessage) {
						pendingInsertLink = markdownLink;
						toasts.showToast("Link will be inserted to your next message.");
					}
					
					if (copyToClipboard) {
						metroCommon.ReactNative.Clipboard.setString(markdownLink);
						toasts.showToast("Copied to clipboard!");
					} else if (!insertToMessage && channelId && MessageSender?.sendMessage) {
						await MessageSender.sendMessage(channelId, {
							content: markdownLink
						});
						toasts.showToast("Link sent to chat.");
					} else if (!insertToMessage) {
						toasts.showToast("Upload succeeded but could not send link.");
					}
				} else {
					console.warn("[Uploader] Upload failed, no link returned.");
					toasts.showToast("Upload failed.");
				}
			} catch (error) {
				console.error("[Uploader] Upload error:", error);
				toasts.showToast("Upload error occurred.");
				
				if (channelId) {
					setTimeout(function() {
						return deleteFailedMessages(channelId);
					}, 500);
				}
			}
			
			return null;
		};
		
		// Return unpatch function
		return function() {
			CloudUploadClass.prototype.reactNativeCompressAndExtractData = originalCompress;
		};
	}

	// ============================================
	// Plugin Lifecycle
	// ============================================

	let patchUnsubscribers = [];

	const pluginExports = {
		onLoad() {
			initializeDefaultSettings();
			registerLitterboxCommand();
			patchUnsubscribers.push(patchFileUploadHandler());
			patchUnsubscribers.push(patchSendMessage());
			performWarmupUploads();
			console.log("[catbox.moe] Plugin loaded.");
			this.settings = SettingsComponent;
		},
		
		onUnload() {
			unregisterLitterboxCommand();
			patchUnsubscribers.forEach(function(unpatch) {
				return unpatch();
			});
			console.log("[catbox.moe] Plugin unloaded.");
		},
		
		settings: SettingsComponent
	};

	exports.default = pluginExports;
	Object.defineProperty(exports, "__esModule", { value: true });
	
})(
	{}, // exports
	vendetta.plugin,
	vendetta.metro.common,
	vendetta.metro,
	vendetta.commands,
	vendetta.ui.toasts,
	vendetta.patcher
);