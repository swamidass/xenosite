from libridass import epoxidation1
from flask import Flask, request, Response
import pickle 
import urllib 
from myjsonify import jsonify
from rdkit import Chem
import pybel as pb
from flask_compress import Compress
# Build Flask app and model predictor

app = Flask(__name__)

Compress(app)

     
p1 = epoxidation1.PyMolPredictor()

headers = {
  "cache-control": "public, max-age=600, s-maxage=6000, stale-while-revalidate",
  "vary": "Accept-Encoding"
}


@app.route("/check", methods=['GET'])
def check():
  return "Server is healthy."

@app.route("/cansmi", methods=['GET'])
def cansmi():
  smiles = urllib.unquote(request.args.get("smi"))
  if not smiles:
       return Response(jsonify({"error": "Not valid input."}), status=401)
  try:  
    cansmi = Chem.MolToSmiles(Chem.MolFromSmiles(smiles))
    return Response(cansmi, status=200, headers=headers)
  except Exception as e:
    return Response(jsonify({"error": str(e), "input": smiles}), status=500)
    
  

@app.route('/', methods=['GET'])
def index():
      smiles = urllib.unquote(request.args.get("smi"))
      if not smiles:
         return Response(jsonify({"error": "Not valid input."}), status=401)

      try:
        results = run_model(smiles)
        return Response(jsonify(results), 
          mimetype='application/json',
          headers=headers
          )
      except Exception as e:
        return Response({"error": str(e)}, status=500)

def run_model(smiles):

    mol = pb.readstring("smi", smiles)
    mol = sanitize(mol)
    sanitized_smi = mol.write('smi').strip()

    result = p1.predict(mol)
    return {"smiles": sanitized_smi, "result": result}



def sanitize(mol):
    mol.removeh()
    mol.convertdbonds()
    mol = pb.readstring('sdf', mol.write('sdf'))
    return mol


application = app


