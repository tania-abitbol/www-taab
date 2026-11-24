import json,sys,base64,urllib.request,os
out,model,prompt=sys.argv[1],sys.argv[2],sys.argv[3]
size=sys.argv[4] if len(sys.argv)>4 else None
body={"model":model,"prompt":prompt,"n":1,"response_format":"b64_json"}
if size: body["size"]=size
req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/openai/images/generations",data=json.dumps(body).encode(),headers={"Content-Type":"application/json","Authorization":"Bearer proxy-injected"})
try:
    r=json.load(urllib.request.urlopen(req,timeout=170))
    open(out,'wb').write(base64.b64decode(r["data"][0]["b64_json"])); print("ok",out,os.path.getsize(out))
except urllib.error.HTTPError as e:
    print("HTTP",e.code,e.read().decode()[:600])
