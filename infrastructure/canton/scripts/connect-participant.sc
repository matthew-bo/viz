// File: infrastructure/canton/scripts/connect-participant.sc

import com.digitalasset.canton.config.RequireTypes.PositiveInt
import com.digitalasset.canton.sequencing.GrpcSequencerConnection
import scala.concurrent.duration._

println(s"Connecting ${participant.name} to domain 'mydomain'...")

// Connect using Canton 2.9.0 API
participant.domains.connect(
  alias = "mydomain",
  connection = GrpcSequencerConnection.tryCreate(
    "http://synchronizer:5018"  // Synchronizer public API endpoint
  ),
  priority = PositiveInt.tryCreate(0),
  synchronize = None,  // Use default synchronization
  timeTracker = None   // Use default time tracker
)

// Wait for connection to be active (max 30 seconds)
utils.retry_until_true(30, 1.second) {
  participant.domains.id_of("mydomain").isDefined
}

println(s"${participant.name} successfully connected to mydomain!")
println(s"Domain ID: ${participant.domains.id_of("mydomain").get}")

