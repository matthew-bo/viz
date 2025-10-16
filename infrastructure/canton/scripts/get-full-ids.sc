// Get full party IDs without truncation
val p1 = participant1.parties.list().find(_.party.filterString.contains("TechBank")).get.party
val p2 = participant2.parties.list().find(_.party.filterString.contains("GlobalCorp")).get.party
val p3 = participant3.parties.list().find(_.party.filterString.contains("RetailFinance")).get.party

println("{")
println(s"""  "TechBank": "${p1.toProtoPrimitive}",""")
println(s"""  "GlobalCorp": "${p2.toProtoPrimitive}",""")
println(s"""  "RetailFinance": "${p3.toProtoPrimitive}"""")
println("}")

