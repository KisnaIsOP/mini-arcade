//
// Multiplayer.js - Multiplayer networking for shared world
//

var MP_Socket = null;
var MP_Connected = false;
var MP_ReconnectDelay = 1000;
var MP_ReconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000];
var MP_ReconnectAttempt = 0;

// Server URL from environment or default to localhost
var MP_ServerURL = window.__MC2D_SERVER_URL__ || 'http://localhost:3000';

//
// MP_UpdateStatus(message, color)
// Update connection status display
//
function MP_UpdateStatus(message, color) {
    var statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.style.background = color;
    }
}

//
// MP_Connect()
// Connect to multiplayer server
//
function MP_Connect() {
    if (MP_Socket && MP_Connected) {
        return;
    }

    console.log('🔌 Connecting to multiplayer server:', MP_ServerURL);
    MP_UpdateStatus('⚪ Connecting...', '#FFC107');

    MP_Socket = io(MP_ServerURL, {
        transports: ['websocket', 'polling']
    });

    // Connection successful
    MP_Socket.on('connect', function() {
        console.log('✅ Connected to multiplayer server');
        MP_Connected = true;
        MP_ReconnectAttempt = 0;
        MP_UpdateStatus('🟢 Connected', '#4CAF50');
    });

    // Receive full world snapshot on join
    MP_Socket.on('world:snapshot', function(worldData) {
        console.log('📦 Received world snapshot:', Object.keys(worldData).length, 'blocks');
        MP_ApplyWorldSnapshot(worldData);
    });

    // Receive incremental world updates
    MP_Socket.on('world:patch', function(updates) {
        MP_ApplyWorldPatch(updates);
    });

    // Handle errors
    MP_Socket.on('error', function(error) {
        console.error('❌ Server error:', error);
        MP_UpdateStatus('❌ Error: ' + error.message, '#F44336');
    });

    // Handle disconnection
    MP_Socket.on('disconnect', function() {
        console.log('🔌 Disconnected from server');
        MP_Connected = false;
        MP_UpdateStatus('🔴 Disconnected', '#F44336');
        MP_ScheduleReconnect();
    });
}

//
// MP_ScheduleReconnect()
// Schedule reconnection with exponential backoff
//
function MP_ScheduleReconnect() {
    var delay = MP_ReconnectDelays[Math.min(MP_ReconnectAttempt, MP_ReconnectDelays.length - 1)];
    MP_ReconnectAttempt++;
    
    console.log('⏰ Reconnecting in', delay / 1000, 'seconds (attempt', MP_ReconnectAttempt, ')');
    MP_UpdateStatus('⏰ Reconnecting in ' + (delay / 1000) + 's...', '#FF9800');
    
    setTimeout(function() {
        if (!MP_Connected) {
            MP_Connect();
        }
    }, delay);
}

//
// MP_SendBlockUpdate(x, y, blockId, action)
// Send block update to server
//
function MP_SendBlockUpdate(x, y, blockId, action) {
    if (!MP_Socket || !MP_Connected) {
        console.warn('⚠️ Not connected to server');
        return false;
    }

    MP_Socket.emit('block:update', {
        x: x,
        y: y,
        blockId: blockId,
        action: action
    });

    return true;
}

//
// MP_ApplyWorldSnapshot(worldData)
// Apply full world snapshot from server
//
function MP_ApplyWorldSnapshot(worldData) {
    // Note: In CHS-Minecraft, blocks are managed by the blocks[] array
    // We don't override the initial terrain, just sync placed/removed blocks
    console.log('📦 World snapshot received with', Object.keys(worldData).length, 'blocks');
    console.log('⚠️ Sync on join not implemented - blocks will sync as updates arrive');
    // Future: Could sync by comparing server blocks with local blocks array
}

//
// MP_ApplyWorldPatch(updates)
// Apply incremental world updates from server
//
function MP_ApplyWorldPatch(updates) {
    // Access the global blocks array from CHS-Minecraft.js
    if (typeof blocks === 'undefined') {
        console.warn('⚠️ blocks array not available');
        return;
    }
    
    for (var i = 0; i < updates.length; i++) {
        var update = updates[i];
        var pixelX = update.x * 32;
        var pixelY = update.y * 32;
        
        if (update.action === 'place') {
            // Remove existing block at position if any
            MP_RemoveBlockAt(pixelX, pixelY);
            // Place new block
            MP_PlaceBlockAt(pixelX, pixelY, update.blockId);
        } else if (update.action === 'remove') {
            MP_RemoveBlockAt(pixelX, pixelY);
        }
    }
}

//
// MP_RemoveBlockAt(x, y)
// Remove block at specific pixel coordinates
//
function MP_RemoveBlockAt(x, y) {
    if (typeof blocks === 'undefined') return;
    
    for (var i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].getX() === x && blocks[i].getY() === y) {
            remove(blocks[i]);
            blocks.splice(i, 1);
            break;
        }
    }
}

//
// MP_PlaceBlockAt(x, y, blockId)
// Place block at specific pixel coordinates from server update
//
function MP_PlaceBlockAt(x, y, blockId) {
    if (typeof blocks === 'undefined' || typeof getBlockTexture === 'undefined') return;
    
    // Convert blockId string to local block type
    var blockType = MP_GetBlockType(blockId);
    if (blockType === null) return;
    
    var blk = new WebImage(getBlockTexture(blockType));
    blk.setPosition(x, y);
    blk.setSize(32, 32);
    add(blk);
    blocks.push(blk);
}

//
// MP_GetBlockType(blockId)
// Convert server blockId string to local block type
//
function MP_GetBlockType(blockId) {
    if (typeof GRASS === 'undefined') return null;
    
    switch(blockId) {
        case 'minecraft:grass': return GRASS;
        case 'minecraft:dirt': return DIRT;
        case 'minecraft:bedrock': return BEDROCK;
        default: return DIRT;
    }
}

// Auto-connect on load
MP_Connect();
