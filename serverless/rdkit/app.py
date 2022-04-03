import json
from rdkit import Chem

def handler(event, context):
    smi = event['smi']
    cansmi = Chem.MolToSmiles(Chem.MolFromSmiles(smi))
    return {"statusCode": 200, "body": {"smi": cansmi}}

