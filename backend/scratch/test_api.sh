#!/bin/bash

# Port of the server
PORT=5001
API_URL="http://localhost:$PORT/api"

echo "=== JIRA LITE API INTEGRATION TESTS ==="

# 1. Sync User Alice
echo "1. Syncing User Alice..."
ALICE_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: alice_uid" \
  -H "x-mock-user-name: Alice Admin" \
  -H "x-mock-user-email: alice@example.com")
echo "$ALICE_RESPONSE"
echo ""

# 2. Sync User Bob
echo "2. Syncing User Bob..."
BOB_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: bob_uid" \
  -H "x-mock-user-name: Bob Developer" \
  -H "x-mock-user-email: bob@example.com")
echo "$BOB_RESPONSE"
echo ""

# 3. Get all Users
echo "3. Fetching all synchronized users..."
USERS_RESPONSE=$(curl -s -X GET "$API_URL/users" \
  -H "x-mock-user-uid: alice_uid")
echo "$USERS_RESPONSE"
echo ""

# 4. Alice creates a Ticket
echo "4. Alice creating a Ticket..."
TICKET_RESPONSE=$(curl -s -X POST "$API_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: alice_uid" \
  -d '{"title": "Implement auth flow", "description": "Need Firebase token validation", "status": "Todo", "priority": "Medium"}')
echo "$TICKET_RESPONSE"

# Extract Ticket ID using python
TICKET_ID=$(echo "$TICKET_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); tid=data['ticket']['id']; print(tid if isinstance(tid, str) else f\"{tid['tb']}:{tid['id']}\")")
echo "Extracted Ticket ID: $TICKET_ID"
echo ""

# 5. List all tickets
echo "5. Listing all tickets..."
curl -s -X GET "$API_URL/tickets" -H "x-mock-user-uid: alice_uid"
echo ""

# 6. Alice updates the ticket (status -> In Progress, priority -> High)
echo "6. Alice updating ticket status and priority..."
curl -s -X PUT "$API_URL/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: alice_uid" \
  -d '{"status": "In Progress", "priority": "High"}'
echo ""

# 7. Alice assigns Bob to the ticket
echo "7. Alice assigning Bob to the ticket..."
curl -s -X POST "$API_URL/tickets/$TICKET_ID/assign" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: alice_uid" \
  -d "{\"userId\": \"user:bob_uid\"}"
echo ""

# 8. Bob adds a comment
echo "8. Bob adding a comment..."
COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-uid: bob_uid" \
  -d '{"comment": "I have set up the basic files. Verifying SurrealDB now."}')
echo "$COMMENT_RESPONSE"
echo ""

# 9. Get ticket comments
echo "9. Fetching ticket comments..."
curl -s -X GET "$API_URL/tickets/$TICKET_ID/comments" -H "x-mock-user-uid: alice_uid"
echo ""

# 10. Get ticket activity log
echo "10. Fetching ticket activity log..."
curl -s -X GET "$API_URL/tickets/$TICKET_ID/activity" -H "x-mock-user-uid: alice_uid"
echo ""

# 11. Test reminder cron:
# We will manually update the ticket's updated_at field in SurrealDB to 10 days ago.
echo "11. Simulating ticket inactivity (dating updated_at to 10 days ago)..."
curl -s -X POST "http://localhost:8000/sql" \
  -u "root:root" \
  -H "NS: taskflow" \
  -H "DB: taskflow" \
  -H "Accept: application/json" \
  -d "UPDATE type::record('$TICKET_ID') SET updated_at = time::now() - 10d;"
echo ""

# 12. Trigger email reminders
echo "12. Manually triggering daily email reminders (should find 1 inactive ticket)..."
curl -s -X POST "$API_URL/tickets/dev/trigger-reminders" -H "x-mock-user-uid: alice_uid"
echo ""

echo "=== TESTS COMPLETED ==="
