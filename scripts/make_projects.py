# Generates dist/projects.js. Usage: python3 scripts/make_projects.py scripts/substack-media.json dist/projects.js && node scripts/build-seo.mjs
import json, sys
media = json.load(open(sys.argv[1]))
out = sys.argv[2]

def vid(pub, vid_id, post_id, title):
    return {"type": "video", "src": f"https://{pub}.substack.com/api/v1/video/upload/{vid_id}/src",
            "poster": f"https://substack-video.s3.amazonaws.com/video_upload/post/{post_id}/{vid_id}/transcoded-00001.png", "alt": title}

def imgs(key, label):
    return [{"type": "img", "src": u, "alt": f"{label} — screen {i+1}"} for i, u in enumerate(media[key])]


def local(slug, files, label):
    return [{"type": "img", "src": f"assets/media/{slug}/{f}", "alt": f"{label} — {f.split('.')[0].replace('-', ' ')}"} for f in files]

lead = [
 dict(slug="voice-commerce", title="Voice-first e-commerce shopping", category="Commerce", tags=["E-commerce"], role="Commerce product builder",
      headline="a shop you can just talk to?",
      desc="Search, ask about products and shortlist them in one continuous voice conversation.",
      query="voice shopping ecommerce discovery live conversation laptops shortlist reviews",
      question="What happens when shopping becomes a conversation instead of a stack of filters?",
      approach="Let people ramble about what they need: budget, use, compromises. A live voice model listens and speaks at the same time, while the screen shows matching products, details, sample reviews and a growing shortlist.",
      tradeoff="Voice is great for working out what you want, but you still need to see products, specs and reviews. The conversation and the screen have to work together.",
      lesson="A twenty-second ramble gives far more signal than anything typed into a search box.",
      source="https://decisionos.me/projects/commerce.html", demo="https://ecommerce-storefront.decisionos.me/", date="2026-09-30",
      media=local("voice-commerce", ["home.png", "budget.png", "product.png", "reviews.png", "shortlist.png"], "Voice shopping") + [{"type": "youtube", "id": "1ZhL4hZDADA", "alt": "Voice shopping walkthrough"}]),
 dict(slug="voice-analytics", title="Voice-based analytics: an analyst on the call", category="Analytics", tags=["E-commerce"], role="Analytics product builder",
      headline="an analyst that answers while you’re still on the call?",
      desc="Ask a question out loud and the evidence appears while the conversation is still happening.",
      query="voice analytics meridian live conversation ecommerce sales traffic",
      question="Why does the answer to “why did sales move?” always arrive after the meeting is over?",
      approach="Meridian listens for the question and makes the answer the main thing on screen: one big number, a trend or a table. Follow-ups reuse the current metric and dates, so the discussion keeps moving.",
      tradeoff="The prototype runs in a browser on illustrative data. Joining Zoom or Teams and handling several speakers is the next step.",
      lesson="People shouldn’t have to turn every follow-up question into a task for someone else.",
      source="https://decisionos.me/projects/analytics.html", demo="https://decisionos.me/analytics", date="2026-10-06",
      media=local("voice-analytics", ["conversation.png"], "Meridian voice analytics") + [{"type": "video", "src": "assets/media/voice-analytics/commerce-intelligence.mp4", "poster": "assets/media/voice-analytics/conversation.png", "alt": "Meridian commerce intelligence walkthrough"}]),
]

DA = "https://decisionaxis.substack.com/p/"
DP = "https://delightfulaiproducts.substack.com/p/"

projects = [
 dict(slug="crm-customer-harness", title="The changing face of CRM", category="CRM", tags=["CRM", "E-commerce"], img="crm", role="CRM & growth strategist",
      headline="a CRM for tracking leads on an e-commerce system?",
      desc="What a CRM competes on once anyone can rebuild the workflow in a weekend.",
      query="crm leads e-commerce customer harness hubspot mcp acquisition",
      question="If the workflow part of a CRM is now easy to replicate, what is left to compete on?",
      approach="Treat MCP as table stakes so customers can drive the CRM from their own agents, then go beyond the named lead: help with acquisition before a contact exists, bring industry intelligence and reach that a self-built workflow can’t, and stay the source of record for outcomes.",
      tradeoff="Opening the CRM to every agent risks turning it into a dumb pipe. The value has to move to context, reach and outcomes that customers can’t configure themselves.",
      lesson="Workflows and customer logic are replicable. Industry intelligence, reach and outcomes aren’t.",
      source=DA + "the-changing-face-of-crm", date="2026-11-16", media=imgs("crm", "Changing face of CRM")),
 dict(slug="seller-onboarding", title="Seller onboarding experience", category="Commerce", tags=["E-commerce"], img="onboarding", role="Product designer",
      headline="a conversational-based onboarding experience?",
      desc="Getting a new marketplace seller to their first sale: one step at a time, with help exactly where they get stuck.",
      query="onboarding b2b sellers conversational activation inline help",
      question="What does a new seller on an e-commerce platform actually need from onboarding?",
      approach="Focus on one thing at a time and hide the rest. Import what the user already has — a catalog on their site, documents in a Drive folder — and let agents cross-check it. Put help inline exactly where they get stuck, answer the broader “how long will this take?” questions, and make mistakes easy to fix.",
      tradeoff="Taking work off the user’s plate means trusting agents to read and verify their data, so the product has to show its checks and make corrections painless.",
      lesson="Users care about more business and an easier life. AI features only matter as a means to that end.",
      source=DA + "nobody-wants-your-ai-features-6-things", date="2026-11-05", media=imgs("onboarding", "B2B onboarding")),
 dict(slug="slack-teammate", title="A Slack teammate for product and analytics teams", category="Agents", img="knowledge", role="Analytics & AI builder",
      headline="a Slack teammate that learns from the whole team?",
      desc="Turning each expert’s personal skills into a shared assistant everyone can use.",
      query="slack teammate shared memory skills analytics knowledge base company brain",
      question="Personal agents are magical, but how does one expert’s workflow benefit the rest of the organisation?",
      approach="Build a departmental harness: capture each expert’s workflows as shared memory without asking them to save anything, make those workflows discoverable when someone asks a related question, and run them in Slack where the team already works.",
      tradeoff="Shared expertise only helps if it stays trustworthy, so the system has to know whose technique it is using and when a standard playbook won’t suffice.",
      lesson="Most repeat questions already have an expert answer somewhere. The missing piece is the system that threads it together.",
      source=DA + "part-1-building-a-slack-based-teammate", date="2026-10-15", media=imgs("slack", "Slack teammate")),
 dict(slug="agentic-seller-experiences", title="Delightful seller experiences in an agentic world", category="Commerce", tags=["E-commerce"], img="marketplace", role="Marketplace product lead",
      headline="an agent that runs the seller side of a marketplace?",
      desc="A three-part series on agents for marketplace sellers — cohorts, workflows and why chat isn’t the strategy.",
      query="marketplace sellers agents cohorts amazon zalando ebay partner experience",
      question="Consumer assistants are booming. Where is the agent that helps a marketplace seller actually scale their business?",
      approach="Pick seller work that spans many functions and departments, understand each cohort’s habits and what they care about, then decide per action whether to ask in chat, show it visually, or simply do it and explain afterwards.",
      tradeoff="Chat is a natural starting point but not the final form. Doing work for sellers needs high confidence, clear explanations and the right medium for each task.",
      lesson="Great products come from understanding users, not templates — and that matters even more when the product starts doing the work.",
      source=DP + "the-ultimate-guide-delightful-seller", date="2026-10-21",
      extra=[("Part 2: Knowing your cohorts", DP + "delightful-seller-experiences-in"), ("Part 3: A chatbot is not your agentic strategy", DP + "delightful-seller-experiences-in-2fb")],
      media=imgs("seller", "Seller experiences")),
 dict(slug="proactive-analytics", title="Proactive analytics: insights without asking", category="Analytics", tags=["E-commerce"], role="E-commerce analytics lead",
      headline="analytics that tell you what changed before you ask?",
      desc="Benchmarks, data-hygiene checks and a daily brief instead of another dashboard.",
      query="ecommerce analytics decision harness insights benchmarks slack mcp",
      question="Most e-commerce firms don’t need another dashboard. How do they find out what moved, why, and what to do about it?",
      approach="Package domain knowledge into a thin agent harness: benchmark against comparable businesses, flag the data-hygiene gaps that block better decisions, learn what normal looks like and surface only meaningful deviations each morning, and build a shared company brain in Slack and MCP.",
      tradeoff="An opinionated harness gives clear answers but must be open about its assumptions, and it improves only as people feed back the “why” behind the numbers.",
      lesson="The opportunity is structure, not invention: the data already exists, it was just never converged.",
      source=DA + "opinionated-ecommerce-analytics-and", demo="https://decisionos.me/analytics", date="2026-10-15", media=local("proactive-analytics", ["proactive.png"], "Meridian proactive insights") + imgs("harness", "Decision harness")),
 dict(slug="software-that-consults", title="Software that consults: context as the new moat", category="Agents", role="AI product strategist",
      headline="software that consults instead of just executing?",
      desc="When software is cheap to build, depth of context, owning the workflow and delivering outcomes become the moat.",
      query="context moat agents harness ecommerce goals markdown",
      question="When the cost of creating software collapses, what still keeps customers?",
      approach="Write the business down so an agent can act on it — goals, ground principles, customers, constraints — in simple files the harness reads before it understands, acts and checks.",
      tradeoff="Context is powerful only if it’s maintained; stale goals or principles make an agent confidently wrong.",
      lesson="The old moats were building and owning the interface. The new ones are context, workflow and outcomes.",
      source=DA + "software-that-consults-why-your-context", date="2026-10-28", media=imgs("consults", "Software that consults")),
 dict(slug="asana-agentic-teardown", title="AI product teardown: Asana as an OS for human–agent teams", category="Product & design", role="AI product designer",
      headline="an AI-native work manager for humans and agents?",
      desc="Concepts for how Asana could look if it were built today, with fictional project data.",
      query="asana teardown work management agents mcp concept",
      question="If we built Asana or Jira from scratch today, how would it look different?",
      approach="Bring work management to where the information already is: work from inside Claude or Codex via MCP, capture decisions from meetings and email, and let agents operate autonomously on the right tasks — without overwhelming existing users.",
      tradeoff="Being usable from any assistant makes the product indispensable but risks making the interface irrelevant; visual extensions keep the experience distinct.",
      lesson="An agent can only help with work that makes it back into the system, so remove the typing step entirely.",
      source=DP + "ai-product-teardown-asana-and-the", date="2026-10-19", media=imgs("asana", "Asana concept")),
 dict(slug="todoist-agent", title="Todoist as a true non-technical agent", category="Product & design", role="AI product designer",
      headline="a to-do app that becomes an agent for everyday people?",
      desc="Ideas for how Todoist could lead in an agent-first world without overwhelming its users.",
      query="todoist agent non-technical cohorts planning to-do",
      question="Todoist is where people decide what to do. How does it become the place where it gets done?",
      approach="Start with cohorts — the productivity guru, the backlog collector, the family COO, the workflow architect — and design how each plans their day and week, then let the agent act on the list.",
      tradeoff="Power users want control and newcomers want simplicity; agent features have to stay invisible until they help.",
      lesson="Knowing exactly who you are solving for is step one of any useful agent.",
      source=DA + "is-todoist-the-underdog-for-creating", date="2026-11-11", media=imgs("todoist", "Todoist concept")),
 dict(slug="travel-agentic-cx", title="Agentic customer experiences for travel", category="Commerce", tags=["E-commerce"], role="Customer experience strategist",
      headline="an agent that plans the whole trip, not just the booking?",
      desc="Earning the next booking by making this trip easier.",
      query="travel agent customer loyalty itinerary personalization",
      question="Why do AI demos keep coming back to travel, and what would actually earn a traveller’s loyalty?",
      approach="Treat a trip as a chain of decisions. Learn the combination of likes and dislikes for this trip, remember where someone has been and how they feel about going back, carry each choice into the next stage, and reach them on the right channel at the right moment.",
      tradeoff="Personal context makes suggestions far better, but it must be earned and used at the right time rather than all at once.",
      lesson="Labels like “beach buff” are a start; the combination of preferences is what describes a traveller.",
      source=DP + "agents-for-travel", date="2026-11-05", media=imgs("travel", "Travel agent")),
 dict(slug="assistant-forks-hermes", title="The forks in the road for assistants", category="Agents", role="AI product designer",
      headline="a personal assistant that keeps up across mobile and desktop?",
      desc="Where personal agents are heading, illustrated with Hermes prototypes.",
      query="assistants hermes personal agent mobile voice continuity prototype",
      question="Do we want separate named agents and messy threads, or one assistant that just knows what’s next?",
      approach="Win on mobile, design for calm rather than stress, solve continuity with summaries and decision points, treat roles as shared context instead of separate bots, and make real-time voice the default input.",
      tradeoff="Personified agents are tempting and may help adoption now, but they are likely a transient phase.",
      lesson="The winning assistant wins on psychology, not just the tech.",
      source=DA + "the-forks-in-the-road-for-assistants", date="2026-10-05",
      demo="https://ecommerce-storefront.decisionos.me/hermes", media=imgs("assistants", "Hermes prototype")),
 dict(slug="investment-agents", title="Agents in investment management", category="Investment management", tags=["Investment management"], role="Fintech product strategist",
      headline="agents built into an online investment platform?",
      desc="A video walkthrough of an investment platform with agents at its core.",
      query="investment platform agents fintech video",
      question="What do agents mean for an online investment platform beyond the chatbot in the corner?",
      approach="Treat the agent as an application that senses, thinks and acts, reasoning through many steps the way a person would, built into the core of the experience.",
      tradeoff="Finance needs trust and clarity, so agent actions must stay explainable.",
      lesson="An agent isn’t a face with eyes. It’s software that can sense, think and act.",
      source=DA + "leveraging-agents-in-investment-management", date="2026-11-26",
      media=[vid("decisionaxis", "0440d543-0d72-4449-912b-e31d1bd78112", "226584255", "Agents in investment management")]),
 dict(slug="animated-shorts", title="Animated shorts on building", category="Storytelling", role="Storyteller & animator",
      headline="short animations that make an idea stick?",
      desc="A series of short animations about ideas, incubation and luck.",
      query="animation shorts video storytelling",
      question="How do you share an idea in under a minute?",
      approach="Pick one idea, give it a world, a voice and a little personality, and tell it as a short animation.",
      tradeoff="Short formats force you to cut everything but the core idea.",
      lesson="Start with the value, then make it memorable.",
      source=DP + "a-millions-new-ways-to-share-an-idea", date="2026-11-07",
      media=[vid("delightfulaiproducts", "1d189dbf-b774-4ef1-b994-759d2b95a284", "222896401", "A million new ways to share an idea"),
             vid("decisionaxis", "53bcdf7f-8e9e-484d-911c-feb361a42e8b", "223892295", "What’s driving you"),
             vid("decisionaxis", "5a5a5a4c-2f99-4e32-9809-261a11603edd", "223753789", "Invest in what’s hard, below the surface"),
             vid("decisionaxis", "f31ad3e9-4cde-482c-a17c-763c62bae9bb", "223751729", "Ideas need incubation"),
             vid("decisionaxis", "b41e860f-23e0-4fe3-be31-1af227dd4760", "223451800", "Improving your luck surface area")]),
]
order = ["voice-commerce", "investment-agents", "voice-analytics", "proactive-analytics", "seller-onboarding"]
allp = lead + projects
projects = sorted(allp, key=lambda p: order.index(p["slug"]) if p["slug"] in order else len(order))
for i, p in enumerate(projects):
    p["featured"] = p["slug"] in order
    p.setdefault("tags", [])
for p in projects:
    p.setdefault("name", "Aditya"); p.setdefault("initials", "A")
    first = next((m for m in p["media"] if m["type"] in ("img", "video")), None)
    p["cover"] = (first.get("poster") or first["src"]) if first else None
open(out, "w").write("// Project library: shared by the homepage (app.js) and scripts/build-seo.mjs.\n// Media comes from the original Substack posts.\nwindow.KNOWHOW_PROJECTS=" + json.dumps(projects, ensure_ascii=False, indent=1) + ";\n")
print(len(projects), "projects;", sum(len(p["media"]) for p in projects), "media items")
