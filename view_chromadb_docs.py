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
    # E.g. https://api.trychroma.com -> host="api.trychroma.com", ssl=True, port=None
    host = url.replace("https://", "").replace("http://", "").split(":")[0]
    ssl = url.startswith("https://")
    
    port_parts = url.replace("https://", "").replace("http://", "").split(":")
    port = int(port_parts[1]) if len(port_parts) > 1 else (443 if ssl else 80)
    
    print(f"Connecting to ChromaDB at {url}...")
    if api_key:
        print(f"Authentication: Token (Tenant: {tenant}, Database: {database})")
    else:
        print("Authentication: None (Local server)")
        
    try:
        # Prepare headers for authenticated connections
        headers = {"X-Chroma-Token": api_key} if api_key else None
        
        client = chromadb.HttpClient(
            host=host,
            port=port,
            ssl=ssl,
            headers=headers,
            tenant=tenant or "default_tenant",
            database=database or "default_database"
        )
        
        # Get list of collections
        collections = client.list_collections()
        print(f"Available Collections: {[c.name for c in collections]}")
        
        if not collections:
            print("No collections found in ChromaDB.")
            return

        print(f"\nFetching data from collection '{collection_name}'...")
        collection = client.get_collection(name=collection_name)
        
        # Retrieve all items
        results = collection.get(include=["documents", "metadatas"])
        
        total_chunks = len(results["ids"])
        print(f"Total chunks found: {total_chunks}")
        
        if total_chunks == 0:
            print("No chunks stored in the collection yet.")
            return

        print("\n--- Document Chunks Stored in ChromaDB ---")
        for i in range(min(20, total_chunks)): # Caps preview at 20 chunks
            doc_id = results["ids"][i]
            doc_content = results["documents"][i]
            metadata = results["metadatas"][i]
            
            print(f"\n[{i+1}/{total_chunks}] Chunk ID: {doc_id}")
            print(f"  Source Document: {metadata.get('source', 'N/A')}")
            print(f"  Chunk Index: {metadata.get('chunkIndex', 'N/A')} of {metadata.get('totalChunks', 'N/A')}")
            print(f"  Content Preview:\n  \"\"\"\n  {doc_content[:200].strip()}...\n  \"\"\"")
            print("-" * 50)
            
        if total_chunks > 20:
            print(f"\n... and {total_chunks - 20} more chunks stored in database.")
            
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")

if __name__ == "__main__":
    main()
