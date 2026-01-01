import Foundation
import Cordova
import AMSMB2 // 必須: PodfileやSPMで 'AMSMB2' をインストールしてください

@objc(SimpleSambaPlugin)
class SimpleSambaPlugin : CDVPlugin {
    
    var smbClient: AMSMB2?
    var host: String = ""
    
    // MARK: - Helper Methods
    
    private func sendSuccess(command: CDVInvokedUrlCommand, result: [String: Any] = [:]) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result)
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    private func sendError(command: CDVInvokedUrlCommand, message: String) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: message)
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    // MARK: - Plugin Actions

    @objc(auth:)
    func auth(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let args = command.arguments, args.count >= 3 else {
                self.sendError(command: command, message: "Invalid arguments")
                return
            }
            
            let user = args[0] as? String ?? ""
            let password = args[1] as? String ?? ""
            let host = args[2] as? String ?? ""
            // domainはAMSMB2では通常ユーザー名に "DOMAIN;user" の形式で含めるか、
            // 認証情報の一部として扱われますが、ここでは簡易的に標準Credentialを使用します。
            
            self.host = host
            
            // URLの構築 (smb://host)
            guard let url = URL(string: "smb://\(host)") else {
                self.sendError(command: command, message: "Invalid Host URL")
                return
            }
            
            let credential = URLCredential(user: user, password: password, persistence: .forSession)
            self.smbClient = AMSMB2(url: url, credential: credential)
            
            // AMSMB2で接続確認を行う
            self.smbClient?.connect { result in
                switch result {
                case .success:
                    self.sendSuccess(command: command)
                case .failure(let error):
                    self.sendError(command: command, message: error.localizedDescription)
                }
            }
        })
    }
    
    @objc(list:)
    func list(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            
            let dir = command.arguments.first as? String ?? ""
            
            client.contentsOfDirectory(atPath: dir) { result in
                switch result {
                case .success(let files):
                    var listArray = [[String: Any]]()
                    for file in files {
                        if file.name == "." || file.name == ".." { continue }
                        
                        var obj = [String: Any]()
                        obj["name"] = file.name
                        if file.isDirectory {
                            obj["isDirectory"] = true
                        } else {
                            obj["isDirectory"] = false
                            obj["size"] = file.size
                        }
                        listArray.append(obj)
                    }
                    self.sendSuccess(command: command, result: ["list": listArray])
                    
                case .failure(let error):
                    self.sendError(command: command, message: error.localizedDescription)
                }
            }
        })
    }
    
    @objc(readFile:)
    func readFile(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            
            let path = command.arguments.first as? String ?? ""
            
            client.downloadItem(atPath: path) { result in
                switch result {
                case .success(let data):
                    let encoded = data.base64EncodedString()
                    self.sendSuccess(command: command, result: ["result": encoded])
                case .failure(let error):
                    self.sendError(command: command, message: error.localizedDescription)
                }
            }
        })
    }
    
    @objc(createFile:)
    func createFile(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            
            let path = command.arguments.first as? String ?? ""
            let encoded = command.arguments[1] as? String ?? ""
            
            guard let data = Data(base64Encoded: encoded) else {
                self.sendError(command: command, message: "Invalid Base64 data")
                return
            }
            
            let tempPath = NSTemporaryDirectory() + UUID().uuidString
            let tempUrl = URL(fileURLWithPath: tempPath)
            
            do {
                try data.write(to: tempUrl)
                client.uploadItem(at: tempUrl, toPath: path) { error in
                    try? FileManager.default.removeItem(at: tempUrl)
                    if let error = error {
                        self.sendError(command: command, message: error.localizedDescription)
                    } else {
                        self.sendSuccess(command: command)
                    }
                }
            } catch {
                self.sendError(command: command, message: error.localizedDescription)
            }
        })
    }
    
    @objc(deleteFile:)
    func deleteFile(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            let path = command.arguments.first as? String ?? ""
            
            client.removeItem(atPath: path) { error in
                if let error = error {
                    self.sendError(command: command, message: error.localizedDescription)
                } else {
                    self.sendSuccess(command: command)
                }
            }
        })
    }
    
    @objc(makeDirectory:)
    func makeDirectory(command: CDVInvokedUrlCommand) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            let path = command.arguments.first as? String ?? ""
            
            client.createDirectory(atPath: path) { error in
                if let error = error {
                    self.sendError(command: command, message: error.localizedDescription)
                } else {
                    self.sendSuccess(command: command)
                }
            }
        })
    }
    
    @objc(removeDirectory:)
    func removeDirectory(command: CDVInvokedUrlCommand) {
        // deleteFileと同じ処理を使用（AMSMB2のremoveItemは通常ディレクトリも削除可能）
        // 再帰的な削除が必要な場合、ライブラリの仕様に依存しますが、
        // 一般的なSMBクライアント実装としてremoveItemを呼び出します。
        self.deleteFile(command: command)
    }
    
    @objc(isDirectory:)
    func isDirectory(command: CDVInvokedUrlCommand) {
        self.checkAttribute(command: command) { $0.isDirectory }
    }
    
    @objc(exists:)
    func exists(command: CDVInvokedUrlCommand) {
        // 存在確認: 属性取得が成功すればtrue、失敗すればエラー(またはfalse)
        // Java版の挙動に合わせて、成功時にtrueを返します。
        self.checkAttribute(command: command) { _ in true }
    }
    
    private func checkAttribute(command: CDVInvokedUrlCommand, checker: @escaping (AMSMB2.FileAttributes) -> Bool) {
        self.commandDelegate.run(inBackground: {
            guard let client = self.smbClient else {
                self.sendError(command: command, message: "Not authenticated")
                return
            }
            let path = command.arguments.first as? String ?? ""
            
            client.attributesItem(atPath: path) { result in
                switch result {
                case .success(let attributes):
                    let res = checker(attributes)
                    self.sendSuccess(command: command, result: ["result": res])
                case .failure(let error):
                    // 存在しない場合やエラーの場合
                    // Java版はexists()でfalseを返すが、例外時はerrorコールバックを呼ぶ実装になっているため
                    // ここではエラーメッセージを返します。
                    if command.methodName == "exists" {
                         // existsアクションの場合のみ、エラーではなくfalseを返す実装にする場合:
                         // self.sendSuccess(command: command, result: ["result": false])
                         // しかしJava版はtry-catchで例外時errorを返しているため、それに合わせます。
                         self.sendError(command: command, message: error.localizedDescription)
                    } else {
                        self.sendError(command: command, message: error.localizedDescription)
                    }
                }
            }
        })
    }
}
