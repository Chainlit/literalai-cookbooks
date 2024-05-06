import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

documentation_path = os.path.join(os.getcwd(), "./documentation")

openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

pinecone_client = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
pinecone_spec = ServerlessSpec(
    cloud=os.environ.get("PINECONE_CLOUD"), region=os.environ.get("PINECONE_REGION")
)


def create_dataset(id, path):
    values = []

    for filename in os.listdir(path):
        # Skip non mdx files
        if not filename.endswith("mdx"):
            continue

        with open(os.path.join(path, filename), "r") as file:
            file_content = file.read()

        # Extract file metadata
        metadata = re.search(
            r"---\ntitle: (.+?)(?:\ndescription: (.+?))?\n---", file_content, re.DOTALL
        )

        # Skip if missing no metadata
        if not metadata:
            continue
        file_title, file_description = metadata.groups()

        # Strop newlines except for code blocks
        content = file_content.split("---", 2)[-1]
        content_parts = re.split(r"(```.*?```)", content, flags=re.DOTALL)

        for i in range(len(content_parts)):
            if not content_parts[i].startswith("```"):
                content_parts[i] = content_parts[i].replace("\n", " ")
        content = "".join(content_parts)

        values.append(
            {"title": file_title, "description": file_description, "content": content}
        )

    return {"id": id, "values": values}


def create_embedding_set(dataset, model="text-embedding-ada-002"):
    values = []

    for item in dataset["values"]:
        input = f"title:{item['title']}_description:{item['description']}_content:{item['content']}"
        response = (
            openai_client.embeddings.create(input=input, model=model).data[0].embedding
        )
        values.append({"text": input, "values": response})

    return {"id": dataset["id"], "values": values}


def create_pinecone_index(name, client, spec):
    if name in client.list_indexes().names():
        client.delete_index(name)

    client.create_index(name, dimension=1536, metric="cosine", spec=spec)
    return pinecone_client.Index(name)


def upload_to_index(index, embedding_set, batch_size=100):
    values = embedding_set["values"]
    total_values = len(values)

    for i in range(0, total_values, batch_size):
        batch = []

        for j in range(i, min(i + batch_size, total_values)):
            batch.append(
                {
                    "id": f"vector_{j}",
                    "values": values[j]["values"],
                    "metadata": {
                        "dataset_id": embedding_set["id"],
                        "text": values[j]["text"],
                    },
                }
            )
        index.upsert(batch)


dataset = create_dataset("dataset_1", documentation_path)
print("Dataset created from documentation")
embeddings = create_embedding_set(dataset)
print("Embeddings created from dataset")
pinecone_index = create_pinecone_index(
    "literal-rag-index", pinecone_client, pinecone_spec
)
print("Pinecone index created")

upload_to_index(pinecone_index, embeddings)
print("Embeddings uploaded to index")
