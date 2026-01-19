
document.addEventListener("DOMContentLoaded", () => {
    const agentList = document.getElementById("agent-list");
    const agentSelect = document.getElementById("agent-select");
    const commandInput = document.getElementById("command-input");
    const runButton = document.getElementById("run-button");
    const componentStatus = document.getElementById("component-status");

    const orchestratorSocket = new WebSocket("ws://localhost:8000/ws/frontend");

    orchestratorSocket.onopen = () => {
        console.log("Connected to Orchestrator");
        fetchAgents();
    };

    orchestratorSocket.onmessage = (event) => {
        console.log("Message from server: ", event.data);
        fetchAgents(); 
    };

    orchestratorSocket.onclose = () => {
        console.log("Disconnected from Orchestrator");
    };

    async function fetchAgents() {
        try {
            const response = await fetch("http://localhost:8000/status");
            const data = await response.json();
            updateAgentList(data.connected_agents);
        } catch (error) {
            console.error("Error fetching agents:", error);
        }
    }

    function updateAgentList(agents) {
        agentList.innerHTML = "";
        agentSelect.innerHTML = "";
        agents.forEach(agent => {
            if (agent !== "frontend") {
                const listItem = document.createElement("li");
                listItem.textContent = agent;
                agentList.appendChild(listItem);

                const option = document.createElement("option");
                option.value = agent;
                option.textContent = agent;
                agentSelect.appendChild(option);
            }
        });
    }

    runButton.addEventListener("click", () => {
        const command = commandInput.value;
        const agent = agentSelect.value;
        if (command && agent) {
            const message = {
                target: agent,
                command: "run",
                payload: command
            };
            // This is a simplified approach. A real implementation would
            // send this to the orchestrator, which would then forward
            // it to the correct agent.
            console.log("Sending command:", message);
            // orchestratorSocket.send(JSON.stringify(message));
            alert("Running commands directly from the frontend is not yet implemented in this prototype.");
        }
    });
});
