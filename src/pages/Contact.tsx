import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-center mb-4 gold-accent pb-8">
              Contact Us
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">
              Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <Card className="glass-card glass-hover rounded-xl">
                <CardContent className="pt-6 text-center">
                  <Mail className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">info.techspotuae@gmail.com</p>
                </CardContent>
              </Card>
              <Card className="glass-card glass-hover rounded-xl">
                <CardContent className="pt-6 text-center">
                  <Phone className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-muted-foreground">+971 586749560</p>
                </CardContent>
              </Card>
              <Card className="glass-card glass-hover rounded-xl">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">United Arab Emirates</p>
                </CardContent>
              </Card>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;