class SimpleSambaPlugin{
	constructor(){
	}

	auth(user, password, host, domain = ""){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "auth",
				[user, password, host, domain]);
		});
	}

	list(dir){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "list",
				[dir]);
		});
	}

	readFile(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					result.result = base64ToUint8Array(result.result);
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "readFile",
				[path]);
		});
	}

	createFile(path, buffer){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "createFile",
				[path, uint8ArrayToBase64(buffer)]);
		});
	}
	
	deleteFile(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "deleteFile",
				[path]);
		});
	}
	
	makeDirectory(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "makeDirectory",
				[path]);
		});
	}

	removeDirectory(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "removeDirectory",
				[path]);
		});
	}

	isDirectory(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "isDirectory",
				[path]);
		});
	}
	
	exists(path){
		return new Promise(function(resolve, reject){
			cordova.exec(
				function(result){
					resolve(result);
				},
				function(err){
					reject(err);
				},
				"SimpleSambaPlugin", "exists",
				[path]);
		});
	}
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  uint8Array.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

module.exports = new SimpleSambaPlugin();
