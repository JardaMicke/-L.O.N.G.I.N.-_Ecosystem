from fastmcp.tools.tool import Tool
from fastmcp.resources.resource import Resource
from fastmcp import FastMCP

class MyTool(Tool):
    """A simple test tool."""
    name: str = "my_tool"
    description: str = "Adds two integers."
    parameters: dict = {"x": int, "y": int}
    resource: Resource

    def __init__(self, resource: Resource):
        super().__init__(resource=resource)

    def run(self, x: int, y: int) -> int:
        """Adds two integers."""
        return x + y

class MyResource(Resource):
    """A simple test resource."""
    uri: str = "my_resource"

    def read(self):
        return {"message": "Hello from MyResource!"}

app = FastMCP(name="My MCP Server")
my_resource = MyResource()
app.add_resource(my_resource)
app.add_tool(MyTool(my_resource))