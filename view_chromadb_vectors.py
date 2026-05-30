import os
import chromadb
from dotenv import load_dotenv
from langsmith import Client

# Load backend configuration
env_path = os.path.join("backend", ".env")
load_dotenv(dotenv_path=env_path)

# Initialize LangSmith tracing if enabled
langsmith_client = None
if os.getenv("LANGSMITH_TRACING") == "true":
    try:
        langsmith_client = Client(
            api_key=os.getenv("LANGSMITH_API_KEY"),
            api_url=os.getenv("LANGSMITH_ENDPOINT")
        )
        print(f"LangSmith tracing enabled for project: {os.getenv('LANGSMITH_PROJECT')}")
    except Exception as e:
        print(f"Failed to initialize LangSmith: {e}")

def main():
    url = os.getenv("CHROMA_URL", "http://127.0.0.1:8000")
    api_key = os.getenv("CHROMA_API_KEY")
    tenant = os.getenv("CHROMA_TENANT")
    database = os.getenv("CHROMA_DATABASE")
    collection_name = os.getenv("COLLECTION_NAME", "rag_documents")
    
    # Parse host/port from URL for client parameters
    host = url.replace("https://", "").replace("http://", "").split(":")[0]
    ssl = url.startswith("https://")
    
    port_parts = url.replace("https://", "").replace("http://", "").split(":")
    port = int(port_parts[1]) if len(port_parts) > 1 else (443 if ssl else 80)
    
    print(f"Connecting to ChromaDB at {url}...")
    try:
        headers = {"X-Chroma-Token": api_key} if api_key else None
        
        client = chromadb.HttpClient(
            host=host,
            port=port,
            ssl=ssl,
            headers=headers,
            tenant=tenant or "default_tenant",
            database=database or "default_database"
        )
        
        collection = client.get_collection(name=collection_name)
        results = collection.get(include=["documents", "metadatas", "embeddings"])
        
        total_chunks = len(results["ids"])
        if total_chunks == 0:
            print("No items in collection.")
            return

        print(f"\nTotal records in ChromaDB: {total_chunks}")
        print("Displaying vector representation and content preview for the first few chunks:\n")
        
        for i in range(min(3, total_chunks)):
            doc_id = results["ids"][i]
            doc_text = results["documents"][i]
            embedding = results["embeddings"][i]
            source = results["metadatas"][i].get("source", "N/A")
            
            print(f"=== Record [{i+1}/{total_chunks}]: {doc_id} ===")
            print(f"Source Doc : {source}")
            
            # Show first 10 dimensions of the embedding vector input
            vector_preview = ", ".join([f"{val:.6f}" for val in embedding[:10]])
            print(f"Vector Input (Embeddings - first 10 of {len(embedding)} dimensions):")
            print(f"  [{vector_preview}, ...]")
            
            # Show text output representing the chunk
            print(f"Text Output (Raw Document Content):")
            print(f"  \"\"\"\n  {doc_text[:200].strip()}...\n  \"\"\"")
            print("-" * 60 + "\n")
            
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")

if __name__ == "__main__":
    main()
