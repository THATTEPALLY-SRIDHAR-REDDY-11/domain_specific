import os
import sys
from langsmith import Client, RunTree
import json
from datetime import datetime

# Initialize LangSmith client from environment variables
client = None
if os.getenv("LANGSMITH_TRACING") == "true":
    try:
        client = Client(
            api_key=os.getenv("LANGSMITH_API_KEY"),
            api_url=os.getenv("LANGSMITH_ENDPOINT")
        )
    except Exception as e:
        print(f"Failed to initialize LangSmith: {e}", file=sys.stderr)
        sys.exit(1)

def create_run(run_data):
    """Create a LangSmith run by storing data for later posting"""
    if not client:
        return {"error": "LangSmith client not initialized"}
    
    try:
        # Store run data in a file for later use
        run_id = run_data.get("id")
        with open(f'langsmith_run_{run_id}.json', 'w') as f:
            json.dump(run_data, f)
        return {"success": True, "run_id": run_id}
    except Exception as e:
        return {"error": str(e)}

def update_run(run_id, update_data):
    """Update a LangSmith run by creating and posting a complete run"""
    if not client:
        return {"error": "LangSmith client not initialized"}
    
    try:
        # Read the stored run data
        with open(f'langsmith_run_{run_id}.json', 'r') as f:
            run_data = json.load(f)
        
        # Create a new RunTree with the complete data and post it immediately
        run = RunTree(
            name=run_data.get("name"),
            run_type=run_data.get("run_type", "chain"),
            inputs=run_data.get("inputs", {}),
            outputs=update_data.get("outputs", {}),
            project_name=os.getenv("LANGSMITH_PROJECT"),
            id=run_id,
            client=client,
            start_time=datetime.fromisoformat(run_data.get("start_time", datetime.utcnow().isoformat())),
            end_time=datetime.fromisoformat(update_data.get("end_time", datetime.utcnow().isoformat())),
            error=update_data.get("error")
        )
        run.post()
        
        # Clean up the stored file
        os.remove(f'langsmith_run_{run_id}.json')
        
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Read command from file (more reliable than stdin on Windows)
    with open('langsmith_command.json', 'r') as f:
        command = json.loads(f.read())
    
    if command["action"] == "create_run":
        result = create_run(command["data"])
    elif command["action"] == "update_run":
        result = update_run(command["run_id"], command["data"])
    else:
        result = {"error": "Unknown command"}
    
    print(json.dumps(result))
