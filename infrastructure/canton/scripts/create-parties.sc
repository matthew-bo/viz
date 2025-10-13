// File: infrastructure/canton/scripts/create-parties.sc

println("Creating parties on participants...")

// Create parties (each party hosted on one participant)
val techBankParty = participant1.parties.enable(
  "TechBank",
  displayName = Some("TechBank")
)

val globalCorpParty = participant2.parties.enable(
  "GlobalCorp",
  displayName = Some("GlobalCorp")
)

val retailFinanceParty = participant3.parties.enable(
  "RetailFinance",
  displayName = Some("RetailFinance")
)

// Output as JSON for automated parsing
val partyJson = s"""{
  "TechBank": "$techBankParty",
  "GlobalCorp": "$globalCorpParty",
  "RetailFinance": "$retailFinanceParty"
}"""

println("=== PARTY IDS JSON ===")
println(partyJson)
println("=== END PARTY IDS ===")

