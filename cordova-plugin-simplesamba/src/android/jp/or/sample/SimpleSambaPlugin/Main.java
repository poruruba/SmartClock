package jp.or.sample.SimpleSambaPlugin;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Properties;
import jcifs.context.BaseContext;
import jcifs.smb.NtlmPasswordAuthenticator;
import jcifs.config.PropertyConfiguration;
import jcifs.CIFSContext;
import jcifs.smb.SmbFile;
import android.util.Base64;
import jcifs.smb.SmbFileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;

public class Main extends CordovaPlugin {
	public static String TAG = "SimpleSambaPlugin.Main";
	private Activity activity;
	private CallbackContext callback;
	CIFSContext context;
	String host = "";

	@Override
	public void initialize(CordovaInterface cordova, CordovaWebView webView)
	{
		Log.d(TAG, "[Plugin] initialize called");
		super.initialize(cordova, webView);

		activity = cordova.getActivity();
	}

	@Override
	public void onResume(boolean multitasking)
	{
		Log.d(TAG, "[Plugin] onResume called");
		super.onResume(multitasking);
	}

	@Override
	public void onPause(boolean multitasking)
	{
		Log.d(TAG, "[Plugin] onPause called");
		super.onPause(multitasking);
	}

	@Override
	public void onNewIntent(Intent intent)
	{
		Log.d(TAG, "[Plugin] onNewIntent called");
		super.onNewIntent(intent);
	}

	private void sendMessageToJs(JSONObject message, CallbackContext callback) {
		final PluginResult result = new PluginResult(PluginResult.Status.OK, message);
		result.setKeepCallback(true);
		if( callback != null )
			callback.sendPluginResult(result);
	}

	public static void deleteRecursive(SmbFile dir) throws Exception {
		if (dir.isDirectory()) {
			for (SmbFile child : dir.listFiles()) {
				deleteRecursive(child);
			}
		}
		dir.delete();
	}

	@Override
	public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException
	{
		Log.d(TAG, "[Plugin] execute called");
		if( action.equals("auth") ){
			String user = args.getString(0);
			String password = args.getString(1);
			String host = args.getString(2);
			String domain = "";
			if( args.length() > 3 )
				domain = args.getString(3);

			try {
				Properties prop = new Properties();
				prop.setProperty("jcifs.smb.client.minVersion", "SMB210");
				prop.setProperty("jcifs.smb.client.maxVersion", "SMB311");

				BaseContext base = new BaseContext(new PropertyConfiguration(prop));
				NtlmPasswordAuthenticator auth = new NtlmPasswordAuthenticator(domain, user, password);
				context = base.withCredentials(auth);

				this.host = host;

				JSONObject result = new JSONObject();
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("list") ){
			String dir = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + dir + "/", context);
				SmbFile[] files = file.listFiles();

				JSONObject result = new JSONObject();
				JSONArray list = new JSONArray();
				for (SmbFile item : files) {
					System.out.println(item);
					JSONObject obj = new JSONObject();
					obj.put("name", item.getName());
					if( item.isDirectory() ){
						obj.put("isDirectory", true);
					}else{
						obj.put("isDirectory", false);
						obj.put("size", item.length());
					}
					list.put(obj);
				}
				result.put("list", list);
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("readFile") ){
			String path = args.getString(0);

			/*
			try{
				SmbFile file = new SmbFile("smb://" + host + path, context);
				File cacheDir = activity.getCacheDir();
				File tempFile = new File(cacheDir, "temp_data.bin");
				FileOutputStream fos = new FileOutputStream(tempFile);
				InputStream is = new SmbFileInputStream(file);
				byte[] data = new byte[102400];
				int nRead;
				while ((nRead = is.read(data, 0, data.length)) != -1) {
					fos.write(data, 0, nRead);
				}
				is.close();
				fos.close();

				JSONObject result = new JSONObject();
				result.put("result", Uri.fromFile(tempFile).toString());
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
			*/
			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);
				InputStream is = new SmbFileInputStream(file);
				ByteArrayOutputStream buffer = new ByteArrayOutputStream();
				byte[] data = new byte[102400];
				int nRead;
				while ((nRead = is.read(data, 0, data.length)) != -1) {
					buffer.write(data, 0, nRead);
				}
				is.close();

				byte[] array = buffer.toByteArray();
				String encoded = Base64.encodeToString(array, Base64.DEFAULT);

				JSONObject result = new JSONObject();
				result.put("result", encoded);
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("createFile") ){
			String path = args.getString(0);
			String encoded = args.getString(1);

			try {
				byte[] decodedBytes = Base64.decode(encoded, Base64.DEFAULT);
				SmbFile file = new SmbFile("smb://" + host + path, context);
				try (OutputStream os = file.getOutputStream() ) {
					os.write(decodedBytes);
					os.flush();
				}

				JSONObject result = new JSONObject();
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("deleteFile") ){
			String path = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);
				if( !file.exists() || !file.isFile() )
					throw new Exception("is not file");
				file.delete();

				JSONObject result = new JSONObject();
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("makeDirectory") ){
			String path = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);
				file.mkdir();

				JSONObject result = new JSONObject();
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("removeDirectory") ){
			String path = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);
				if( !file.exists() || !file.isDirectory() )
					throw new Exception("is not directory");
				deleteRecursive(file);

				JSONObject result = new JSONObject();
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("isDirectory") ){
			String path = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);

				JSONObject result = new JSONObject();
				result.put("result", file.isDirectory());
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		if( action.equals("exists") ){
			String path = args.getString(0);

			try {
				SmbFile file = new SmbFile("smb://" + host + path, context);

				JSONObject result = new JSONObject();
				result.put("result", file.exists());
				callbackContext.success(result);

				sendMessageToJs(result, callback);
			}catch(Exception ex){
				callbackContext.error(ex.getMessage());
			}
		}else

		{
			String message = "Unknown action : (" + action + ") " + args.getString(0);
			Log.d(TAG, message);
			callbackContext.error(message);
			return false;
		}

		return true;
	}
}