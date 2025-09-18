-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requester_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "FriendRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendRequest_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friendship_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FriendRequest_recipient_idx" ON "FriendRequest"("recipient_id");

-- CreateIndex
CREATE INDEX "FriendRequest_requester_idx" ON "FriendRequest"("requester_id");

-- CreateIndex
CREATE INDEX "FriendRequest_requester_id_status_idx" ON "FriendRequest"("requester_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_requester_id_recipient_id_key" ON "FriendRequest"("requester_id", "recipient_id");

-- CreateIndex
CREATE INDEX "Friendship_user_a_id_idx" ON "Friendship"("user_a_id");

-- CreateIndex
CREATE INDEX "Friendship_user_b_id_idx" ON "Friendship"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user_a_id_user_b_id_key" ON "Friendship"("user_a_id", "user_b_id");

