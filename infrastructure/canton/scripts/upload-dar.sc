// Bootstrap script for Canton participant
// Automatically uploads the payment-demo DAR on startup

import java.io.File

val darPath = "/canton/payment-demo-0.0.1.dar"
val darFile = new File(darPath)

if (darFile.exists()) {
  println(s"Uploading DAR from $darPath...")
  participant1.dars.upload(darPath)
  println("DAR uploaded successfully!")
} else {
  println(s"WARNING: DAR file not found at $darPath")
}
