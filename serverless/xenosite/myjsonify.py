import json

class FrozenSetEncoder(json.JSONEncoder):
    def transformer(self, o):
        if isinstance(o, frozenset):
           i = list(o)
           i.sort()
           return self._encode(".".join(str(x) for x in i))
           
        return self._encode(o)
        
        
    def _encode(self, o):
        if isinstance(o, dict):
           return {self.transformer(k): self.transformer(v) for k, v in o.items()}
        elif isinstance(o, frozenset):
           return self.transformer(o)
        else:
           return o

    def encode(self, obj):
        return super(FrozenSetEncoder, self).encode(self._encode(obj))
        

def jsonify(obj):
  return json.dumps(obj, cls=FrozenSetEncoder)
