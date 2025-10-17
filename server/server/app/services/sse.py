"""Server-Sent Events manager for real-time updates."""

import asyncio
import json
from typing import Dict, Set, Any
from collections import defaultdict
from fastapi import Request


class SSEManager:
    """Manages SSE connections and broadcasts updates to clients."""

    def __init__(self):
        # event_id -> set of queues
        self.connections: Dict[str, Set[asyncio.Queue]] = defaultdict(set)

    async def connect(self, event_id: str) -> asyncio.Queue:
        """
        Register a new SSE connection for an event.

        Args:
            event_id: The event ID to subscribe to

        Returns:
            Queue for receiving messages
        """
        queue = asyncio.Queue(maxsize=100)
        self.connections[event_id].add(queue)
        return queue

    async def disconnect(self, event_id: str, queue: asyncio.Queue):
        """
        Unregister an SSE connection.

        Args:
            event_id: The event ID
            queue: The queue to remove
        """
        self.connections[event_id].discard(queue)
        if not self.connections[event_id]:
            del self.connections[event_id]

    async def broadcast(self, event_id: str, event_type: str, data: Any):
        """
        Broadcast a message to all connected clients for an event.

        Args:
            event_id: The event ID
            event_type: Type of event (participant_joined, candidate_added, vote_cast, etc.)
            data: Event data to send
        """
        if event_id not in self.connections:
            return

        message = {
            "type": event_type,
            "data": data
        }

        # Send to all connected clients
        dead_queues = set()
        for queue in self.connections[event_id]:
            try:
                await queue.put(message)
            except asyncio.QueueFull:
                # Queue is full, mark for removal
                dead_queues.add(queue)

        # Clean up dead connections
        for queue in dead_queues:
            self.connections[event_id].discard(queue)

    async def event_stream(self, event_id: str, request: Request):
        """
        Generate SSE stream for a client.

        Args:
            event_id: The event ID to subscribe to
            request: FastAPI request object

        Yields:
            SSE-formatted messages
        """
        queue = await self.connect(event_id)

        try:
            # Send initial connection message
            yield f"event: connected\ndata: {json.dumps({'event_id': event_id})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)

                    # Format as SSE with event type in data payload
                    # Don't use custom event types - send everything as default "message" type
                    event_type = message.get("type", "message")
                    event_data = {
                        "event": event_type,
                        "data": message.get("data", {})
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f": keepalive\n\n"

        finally:
            await self.disconnect(event_id, queue)


# Singleton instance
sse_manager = SSEManager()
