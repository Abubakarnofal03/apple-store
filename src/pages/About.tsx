import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-center mb-4 gold-accent pb-8">
              About tech spot uae
            </h1>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg mx-auto">
              <p className="text-lg leading-relaxed mb-6">
                Welcome to tech spot uae, where sophistication meets everyday elegance. We curate a 
                distinguished collection of premium home décor and luxury leather accessories for 
                those who appreciate the finer things in life.
              </p>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">Our Story</h2>
              <p className="leading-relaxed mb-6">
                Founded with a vision to bring premium lifestyle products to discerning customers, 
                tech spot uae has become synonymous with quality, elegance, and timeless design. Each 
                piece in our collection is carefully selected to meet our exacting standards of 
                craftsmanship and style.
              </p>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">Our Values</h2>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Quality First:</strong> We never compromise on the quality of our products. 
                    Every item is crafted with attention to detail and built to last.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Timeless Design:</strong> Our collections feature classic designs that 
                    transcend trends, ensuring your investment remains stylish for years to come.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Customer Satisfaction:</strong> Your satisfaction is our priority. We're 
                    committed to providing exceptional service and support throughout your shopping journey.
                  </div>
                </li>
              </ul>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">What We Offer</h2>
              <p className="leading-relaxed mb-6">
                From exquisite home décor pieces that transform living spaces to handcrafted leather 
                wallets that combine functionality with elegance, our collection caters to those who 
                demand excellence in every aspect of their lifestyle.
              </p>

              <div className="bg-muted/50 glass-card p-8 rounded-xl mt-12">
                <p className="text-center italic text-lg">
                  "Luxury is in each detail. It's in the quality, the craftsmanship, and the experience."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;