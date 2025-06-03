import json
import random
from datetime import datetime, timedelta
import uuid

# Load the accounts data
with open('accounts.json', 'r') as f:
    accounts = json.load(f)

# Lists for generating random data
prospect_statuses = ["Lead", "Qualified Lead", "Opportunity", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold"]
prospect_sources = ["Website", "Referral", "Trade Show", "Cold Call", "Email Campaign", "Social Media", "Partner", "Webinar", "Content Download", "Direct Mail"]
prospect_interests = ["Product Demo", "Pricing Information", "Technical Specifications", "Case Studies", "Free Trial", "Consultation", "Implementation Support", "Training", "Custom Solution", "Integration"]

activity_types = ["Email", "Call", "Meeting", "Demo", "Proposal", "Contract", "Support", "Training", "Implementation", "Review"]
activity_statuses = ["Completed", "Scheduled", "Cancelled", "Postponed", "In Progress", "Pending"]
activity_priorities = ["Low", "Medium", "High", "Urgent"]
activity_outcomes = ["Positive", "Neutral", "Negative", "Inconclusive", "Requires Follow-up"]

# Function to generate a random date within the past year
def generate_date(days_ago_max=365):
    days_ago = random.randint(0, days_ago_max)
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

# Function to generate a random future date within the next 30 days
def generate_future_date(days_ahead_max=30):
    days_ahead = random.randint(1, days_ahead_max)
    return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

# Function to generate a random time
def generate_time():
    hour = random.randint(8, 17)  # Business hours 8 AM to 5 PM
    minute = random.choice([0, 15, 30, 45])
    return f"{hour:02d}:{minute:02d}"

# Function to generate a random prospect
def generate_prospect(account, prospect_id):
    # Use one of the account's contacts as the primary prospect contact
    if account["contacts"]:
        contact = random.choice(account["contacts"])
        first_name = contact["first_name"]
        last_name = contact["last_name"]
        email = contact["email"]
        phone = contact["phone"]
        title = contact["title"]
    else:
        # Generate random contact info if no contacts exist
        first_name = random.choice(["John", "Jane", "Robert", "Mary", "Michael", "Linda", "William", "Patricia", "David", "Jennifer"])
        last_name = random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"])
        email = f"{first_name.lower()}.{last_name.lower()}@{account['company_name'].lower().replace(' ', '').replace('-', '')}.com"
        phone = f"+{random.randint(1, 9)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}"
        title = random.choice(["CEO", "CTO", "CFO", "COO", "President", "Vice President", "Director", "Manager", "Supervisor", "Team Lead"])
    
    # Generate prospect data
    status = random.choice(prospect_statuses)
    
    # Set estimated value based on status
    if status in ["Closed Won", "Negotiation", "Proposal"]:
        estimated_value = random.randint(10000, 500000)
    elif status in ["Opportunity", "Qualified Lead"]:
        estimated_value = random.randint(5000, 100000)
    else:
        estimated_value = random.randint(1000, 50000)
    
    # Set probability based on status
    if status == "Closed Won":
        probability = 100
    elif status == "Closed Lost":
        probability = 0
    elif status == "Negotiation":
        probability = random.randint(70, 95)
    elif status == "Proposal":
        probability = random.randint(50, 70)
    elif status == "Opportunity":
        probability = random.randint(30, 50)
    elif status == "Qualified Lead":
        probability = random.randint(10, 30)
    else:
        probability = random.randint(1, 10)
    
    return {
        "prospect_id": prospect_id,
        "account_id": account["account_id"],
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "title": title,
        "status": status,
        "source": random.choice(prospect_sources),
        "created_date": generate_date(),
        "last_contact_date": generate_date(days_ago_max=30),
        "estimated_value": estimated_value,
        "probability": probability,
        "interests": random.sample(prospect_interests, k=random.randint(1, 3)),
        "assigned_to": random.choice(["Alex Johnson", "Sam Williams", "Taylor Smith", "Jordan Brown", "Casey Davis"]),
        "next_step": random.choice(["Follow-up call", "Send proposal", "Schedule demo", "Technical discussion", "Contract review", "Needs analysis", "Decision meeting"])
    }

# Function to generate a random activity
def generate_activity(prospect, activity_id, index):
    activity_type = random.choice(activity_types)
    status = random.choice(activity_statuses)
    
    # Generate activity date based on index (older activities for higher indices)
    if index < 2:  # Most recent activities
        activity_date = generate_date(days_ago_max=7)
    else:
        activity_date = generate_date(days_ago_max=90)
    
    # For scheduled activities, use future dates
    if status == "Scheduled":
        activity_date = generate_future_date()
    
    # Generate activity description based on type
    descriptions = {
        "Email": [
            f"Sent follow-up email to {prospect['first_name']} regarding their interest in our products.",
            f"Email response from {prospect['first_name']} with questions about pricing and features.",
            f"Sent product information email to {prospect['first_name']} as requested.",
            f"Email introduction to {prospect['first_name']} from marketing team.",
            f"Sent proposal via email to {prospect['first_name']} for review."
        ],
        "Call": [
            f"Discovery call with {prospect['first_name']} to understand their needs.",
            f"Follow-up call with {prospect['first_name']} to discuss proposal.",
            f"Cold call to {prospect['first_name']} to introduce our services.",
            f"Call with {prospect['first_name']} to address concerns about implementation.",
            f"Scheduled call with {prospect['first_name']} to discuss next steps."
        ],
        "Meeting": [
            f"Initial meeting with {prospect['first_name']} and team to present our solutions.",
            f"Strategy meeting with {prospect['first_name']} to discuss implementation plan.",
            f"Executive meeting with {prospect['first_name']} and decision makers.",
            f"Project kickoff meeting with {prospect['first_name']} and stakeholders.",
            f"Quarterly review meeting with {prospect['first_name']} to discuss progress."
        ],
        "Demo": [
            f"Product demonstration for {prospect['first_name']} and team.",
            f"Technical demo focusing on integration capabilities for {prospect['first_name']}.",
            f"Custom demo addressing specific use cases for {prospect['first_name']}.",
            f"Follow-up demo with {prospect['first_name']} to show additional features.",
            f"Executive demo for {prospect['first_name']} and C-level stakeholders."
        ],
        "Proposal": [
            f"Sent initial proposal to {prospect['first_name']} for review.",
            f"Revised proposal based on feedback from {prospect['first_name']}.",
            f"Proposal presentation meeting with {prospect['first_name']} and team.",
            f"Final proposal adjustments as requested by {prospect['first_name']}.",
            f"Proposal acceptance confirmation from {prospect['first_name']}."
        ],
        "Contract": [
            f"Sent contract to {prospect['first_name']} for signature.",
            f"Contract negotiation call with {prospect['first_name']} and legal team.",
            f"Contract amendments as requested by {prospect['first_name']}.",
            f"Contract signed by {prospect['first_name']} and returned.",
            f"Contract renewal discussion with {prospect['first_name']}."
        ],
        "Support": [
            f"Technical support call with {prospect['first_name']} regarding implementation.",
            f"Resolved issue reported by {prospect['first_name']} with our product.",
            f"Support ticket opened by {prospect['first_name']} for feature request.",
            f"Follow-up on support case with {prospect['first_name']}.",
            f"Proactive support check-in with {prospect['first_name']}."
        ],
        "Training": [
            f"Initial training session with {prospect['first_name']} and team.",
            f"Advanced features training for {prospect['first_name']} and power users.",
            f"Administrator training for {prospect['first_name']}'s IT team.",
            f"Custom workflow training as requested by {prospect['first_name']}.",
            f"Refresher training session with {prospect['first_name']}'s new team members."
        ],
        "Implementation": [
            f"Implementation planning meeting with {prospect['first_name']} and IT team.",
            f"Data migration discussion with {prospect['first_name']}.",
            f"Implementation progress review with {prospect['first_name']}.",
            f"Implementation issue resolution for {prospect['first_name']}.",
            f"Final implementation sign-off meeting with {prospect['first_name']}."
        ],
        "Review": [
            f"Quarterly business review with {prospect['first_name']} to discuss results.",
            f"Product feedback session with {prospect['first_name']} and users.",
            f"Performance review meeting with {prospect['first_name']}.",
            f"ROI analysis presentation for {prospect['first_name']} and executives.",
            f"Annual contract review with {prospect['first_name']}."
        ]
    }
    
    description = random.choice(descriptions[activity_type])
    
    # Generate notes based on outcome
    outcome = random.choice(activity_outcomes) if status == "Completed" else None
    
    notes_templates = {
        "Positive": [
            f"{prospect['first_name']} expressed strong interest in our solution. They particularly liked our {random.choice(['pricing model', 'feature set', 'integration capabilities', 'support options', 'implementation timeline'])}.",
            f"Very productive {activity_type.lower()}. {prospect['first_name']} is ready to move forward with next steps.",
            f"{prospect['first_name']} agreed to our proposal and wants to proceed quickly.",
            f"Great response from {prospect['first_name']}. They see clear value in our offering.",
            f"{prospect['first_name']} confirmed budget approval and is eager to get started."
        ],
        "Neutral": [
            f"{prospect['first_name']} needs more time to consider options. Will follow up next week.",
            f"{prospect['first_name']} requested additional information about {random.choice(['pricing', 'features', 'technical specifications', 'implementation process', 'support options'])}.",
            f"Standard {activity_type.lower()} with {prospect['first_name']}. No major developments.",
            f"{prospect['first_name']} is still evaluating competitors. Need to emphasize our differentiators.",
            f"{prospect['first_name']} wants to involve more stakeholders before making a decision."
        ],
        "Negative": [
            f"{prospect['first_name']} expressed concerns about our {random.choice(['pricing', 'implementation timeline', 'feature limitations', 'support model', 'contract terms'])}.",
            f"Difficult {activity_type.lower()} with {prospect['first_name']}. They are leaning toward a competitor.",
            f"{prospect['first_name']} has budget constraints that may delay the project.",
            f"{prospect['first_name']} found our solution doesn't meet their requirements for {random.choice(['scalability', 'customization', 'integration', 'reporting', 'security'])}.",
            f"{prospect['first_name']} is putting the project on hold due to internal reorganization."
        ],
        "Inconclusive": [
            f"Unable to cover all agenda items with {prospect['first_name']}. Need to schedule follow-up.",
            f"{prospect['first_name']} had limited time for our {activity_type.lower()}. Will need to reconnect.",
            f"Technical issues prevented full {activity_type.lower()} with {prospect['first_name']}. Rescheduling.",
            f"{prospect['first_name']} was unprepared for discussion. Need to resend materials and follow up.",
            f"Mixed signals from {prospect['first_name']}. Need to clarify their priorities."
        ],
        "Requires Follow-up": [
            f"{prospect['first_name']} requested follow-up with more detailed {random.choice(['pricing', 'technical specifications', 'case studies', 'implementation plan', 'ROI analysis'])}.",
            f"Need to schedule technical team meeting with {prospect['first_name']}'s IT department.",
            f"{prospect['first_name']} wants to see a custom demo addressing their specific use case.",
            f"Action item: Send {prospect['first_name']} the requested documentation by end of week.",
            f"{prospect['first_name']} asked for references from similar companies in their industry."
        ]
    }
    
    notes = notes_templates[outcome] if outcome else None
    if notes:
        notes = random.choice(notes)
    
    # For scheduled activities, generate a time
    scheduled_time = generate_time() if status == "Scheduled" else None
    
    return {
        "activity_id": activity_id,
        "prospect_id": prospect["prospect_id"],
        "account_id": prospect["account_id"],
        "type": activity_type,
        "description": description,
        "date": activity_date,
        "time": scheduled_time,
        "status": status,
        "priority": random.choice(activity_priorities),
        "assigned_to": prospect["assigned_to"],
        "outcome": outcome,
        "notes": notes,
        "duration_minutes": random.choice([15, 30, 45, 60, 90, 120]) if activity_type in ["Meeting", "Demo", "Training"] else None
    }

# Generate prospects and activities for each account
all_prospects = []
all_activities = []

prospect_id_counter = 1
activity_id_counter = 1

for account in accounts:
    # Generate 1-3 prospects per account
    num_prospects = random.randint(1, 3)
    
    account_prospects = []
    for i in range(num_prospects):
        prospect_id = f"PROS{prospect_id_counter:04d}"
        prospect_id_counter += 1
        
        prospect = generate_prospect(account, prospect_id)
        account_prospects.append(prospect)
        all_prospects.append(prospect)
        
        # Generate 3-7 activities per prospect
        num_activities = random.randint(3, 7)
        
        for j in range(num_activities):
            activity_id = f"ACT{activity_id_counter:04d}"
            activity_id_counter += 1
            
            activity = generate_activity(prospect, activity_id, j)
            all_activities.append(activity)

# Save to JSON files
with open('prospects.json', 'w') as f:
    json.dump(all_prospects, f, indent=2)

with open('activities.json', 'w') as f:
    json.dump(all_activities, f, indent=2)

print(f"Generated {len(all_prospects)} prospects and {len(all_activities)} activities")
print(f"Saved to prospects.json and activities.json")
