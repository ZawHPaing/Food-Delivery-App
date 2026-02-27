-- 1. Create Dispatch Requests table
CREATE TABLE IF NOT EXISTS dispatch_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id BIGINT NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Ensure a rider only gets one pending request per order
    UNIQUE(order_id, rider_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dispatch_order ON dispatch_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_rider ON dispatch_requests(rider_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status ON dispatch_requests(status);
