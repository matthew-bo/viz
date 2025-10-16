// Print full party IDs in JSON format
println("{")
val parties1 = participant1.parties.list()
val parties2 = participant2.parties.list()
val parties3 = participant3.parties.list()

parties1.foreach { p =>
  if (p.party.filterString.contains("TechBank")) {
    println(s"""  "TechBank": "${p.party}",""")
  }
}

parties2.foreach { p =>
  if (p.party.filterString.contains("GlobalCorp")) {
    println(s"""  "GlobalCorp": "${p.party}",""")
  }
}

parties3.foreach { p =>
  if (p.party.filterString.contains("RetailFinance")) {
    println(s"""  "RetailFinance": "${p.party}"""")
  }
}

println("}")

