#!/usr/bin/env python3
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIRECTIONS = {"n","ne","e","se","s","sw","w","nw","up","down","in","out"}

def fail(path, message):
    raise ValueError(f"{path}: {message}")

def validate(path):
    if path.stat().st_size > 20_000_000: fail(path, "file exceeds 20 MB")
    data=json.loads(path.read_text())
    if data.get("format") != "DragonsGateHUD-map" or data.get("schema") != 1: fail(path,"unsupported format")
    publisher=path.parent.name
    if data.get("publisher") != publisher or not re.fullmatch(r"[A-Za-z0-9-]{1,39}",publisher): fail(path,"publisher must match its folder")
    if path.stem != data.get("slug") or not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,63}",path.stem): fail(path,"slug must match filename")
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
            if edge.get("direction") not in DIRECTIONS or edge.get("destination") not in ids: fail(path,"invalid directional exit")
        for edge in room.get("special",[]):
            edges+=1; command=edge.get("command","")
            if edge.get("destination") not in ids or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 '\-]{0,79}",command): fail(path,"unsafe special exit")
    if edges>100000: fail(path,"too many edges")
    return {"publisher":publisher,"slug":path.stem,"title":data.get("title",path.stem),"creator":data.get("creator","Unknown"),"rooms":len(rooms),"derived_from":data.get("derived_from")}

def main():
    records=[]
    for path in sorted((ROOT/"maps").glob("*/*.json")): records.append(validate(path))
    (ROOT/"catalog.json").write_text(json.dumps({"schema":1,"maps":records},indent=2)+"\n")
    print(f"validated {len(records)} maps")

if __name__ == "__main__":
    try: main()
    except Exception as exc: print(exc,file=sys.stderr); raise SystemExit(1)
