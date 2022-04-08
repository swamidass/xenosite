#from libridass import epoxidation1
from flask import Flask, request
#import pybel as pb
#import pandas as pd

# Build Flask app and model predictor
app = Flask(__name__)

# Create model predictor
#p1 = epoxidation1.PyMolPredictor()

@app.route('/')
def handler():
  return request.json()


def temp(req):
    results = []
    error = False
    for req in request.body:
        try:
            res = run_model(req)
        except Exception as e:
            res = {"error": str(e), "input": req}
            error = True
        results.append(res)
    return {"body": results, "status": 500 if error else 200}

def run_model(req):
    sdfile = req.get("sdfile")
    smiles = req.get("smiles")
    return {"sdfile": sdfile, "smiles": smiles, "request": req}

    # Build Predictor
    models = ['Epoxidation']
    index = []
    predictions = []

    # If input is an sdf
    if sdfile:

        # Read in SDF
        mols = list(pb.readfile('sdf', sdfile))

        # For each molecule
        for i, mol in enumerate(mols):

            # Sanitize and predict
            mol = sanitize(mol)
            all_results = p1.predict(mol)

            # Sort results
            mol_level_result = all_results['mol']
            result = all_results['bond']

            # Add to list of predictions
            index += ["%s.%d" % (mol.title, i)]
            predictions.append(mol_level_result)
            for bond_key, pred in result.iteritems():
                atom_ids = [x for x in bond_key]
                index.append("%s.%d.%d.%d" % (mol.title, i, atom_ids[0], atom_ids[1]))
                predictions.append(pred)

    # If input is a list of smiles
    elif smiles:

        # For each molecule
        for i, smi in enumerate(smiles):

            # Read in smile
            mol = pb.readstring("smi", smi)

            # Sanitize and predict
            mol = sanitize(mol)
            all_results = p1.predict(mol)

            # Sort results
            mol_level_result = all_results['mol']
            result = all_results['bond']

            # Add to list of predictions
            index += ["%s.%d" % (mol.title, i)]
            predictions.append(mol_level_result)
            for bond_key, pred in result.iteritems():
                atom_ids = [x for x in bond_key]
                index.append("%s.%d.%d.%d" % (mol.title, i, atom_ids[0], atom_ids[1]))
                predictions.append(pred)

    # If sdfile and smiles is None
    else:
        raise "No input"

    # Create final prediction file
    df = pd.DataFrame(predictions, columns=models, index=index)
    df.index.name = 'Mol.MolID.AtomOneID.AtomTwoID'

    # Convert to json
    json_result = df.to_json(orient='table')


    # {predictions, input, sanitized_input}
    return json_result


def sanitize(mol):
    mol.removeh()
    mol.convertdbonds()
    mol = pb.readstring('sdf', mol.write('sdf'))
    return mol


application = app


