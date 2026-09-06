#!/usr/bin/env python3
import hashlib, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIRECTIONS = {"n","ne","e","se","s","sw","w","nw","up","down","in","out"}

def fail(path, message):
    raise ValueError(f"{path}: {message}")

def validate(path):
    if path.stat().st_size > 20_000_000: fail(path, "file exceeds 20 MB")
    data=json.loads(path.read_text())
    if data.get("format") != "DragonsGateHUD-map" or data.get("schema") != 1: fail(path,"unsupported format")
    provenance=data.get("provenance")
    if not isinstance(provenance,dict): fail(path,"missing provenance")
    publisher=path.parent.name
    if provenance.get("publisher") != publisher or not re.fullmatch(r"[A-Za-z0-9-]{1,39}",publisher): fail(path,"provenance publisher must match its folder")
    if path.stem != provenance.get("slug") or not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,63}",path.stem): fail(path,"provenance slug must match filename")
    if not isinstance(provenance.get("artifact_id"),str) or not provenance["artifact_id"]: fail(path,"missing artifact ID")
    if not isinstance(provenance.get("author"),str) or not provenance["author"]: fail(path,"missing author")
    rooms=data.get("rooms");
    if not isinstance(rooms,list) or not rooms or len(rooms)>20000: fail(path,"invalid room collection")
    ids=set(); coords=set(); edges=0
    for room in rooms:
        rid=room.get("id")
        if not isinstance(rid,int) or rid<=0 or rid in ids: fail(path,"invalid or duplicate canonical room ID")
        ids.add(rid); key=(room.get("partition"),room.get("x"),room.get("y"),room.get("z"))
        if key in coords: fail(path,"duplicate coordinate in a partition")
        coords.add(key)
    for room in rooms:
        for edge in room.get("exits",[]):
            edges+=1
            if edge.get("direction") not in DIRECTIONS or edge.get("to") not in ids: fail(path,"invalid directional exit")
        for edge in room.get("special_exits",[]):
            edges+=1; command=edge.get("command","")
            if edge.get("to") not in ids or not isinstance(command,str) or not command.strip() or len(command)>160: fail(path,"unsafe special exit")
    if edges>100000: fail(path,"too many edges")
    raw=path.read_bytes()
    areas=sorted({str(room.get("area","unknown")) for room in rooms})
    base={"publisher":publisher,"slug":path.stem,"name":data.get("title",path.stem),"author":provenance["author"],"description":data.get("description",""),"version":str(data.get("version","1.0.0")),"areas":areas,"room_count":len(rooms),"bytes":len(raw),"download_url":f"https://raw.githubusercontent.com/wizzydizzy-ctrl/dragons-gate-map-library/main/maps/{publisher}/{path.stem}.json","sha256":hashlib.sha256(raw).hexdigest()}
    selection=provenance.get("selection") if isinstance(provenance.get("selection"),dict) else {}
    scope={"all":"full_map","area":"area","subarea":"subarea"}.get(provenance.get("scope","all"),"full_map")
    detailed={**base,"scope":scope,"map_name":data.get("title",path.stem),"area_name":selection.get("area_name"),"subarea_name":selection.get("subarea_name"),"subareas":sorted({str(room.get("partition","unknown")) for room in rooms})}
    return base,detailed

def main():
    records=[]; detailed=[]
    for path in sorted((ROOT/"maps").glob("*/*.json")):
        base,v2=validate(path); records.append(base); detailed.append(v2)
    (ROOT/"catalog.json").write_text(json.dumps({"schema":1,"maps":records},indent=2)+"\n")
    (ROOT/"catalog-v2.json").write_text(json.dumps({"schema":2,"maps":detailed},indent=2)+"\n")
    print(f"validated {len(records)} maps")

if __name__ == "__main__":
    try: main()
    except Exception as exc: print(exc,file=sys.stderr); raise SystemExit(1)
