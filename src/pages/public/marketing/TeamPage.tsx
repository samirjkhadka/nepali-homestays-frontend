import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';
const team = [
  {
    name: 'Bikash Sharma',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'A passionate traveler with 15+ years in tourism. Founded Nepali Homestays to share authentic Nepali hospitality with the world.',
    social: { linkedin: '#', twitter: '#', email: 'bikash@nepalihomestays.com' },
  },
  {
    name: 'Sunita Tamang',
    role: 'Head of Operations',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Expert in hospitality and community development. Ensures every homestay meets our quality standards.',
    social: { linkedin: '#', twitter: '#', email: 'sunita@nepalihomestays.com' },
  },
  {
    name: 'Rajan Gurung',
    role: 'Community Manager',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: 'Connecting travelers with authentic local experiences. Works directly with our host families.',
    social: { linkedin: '#', twitter: '#', email: 'rajan@nepalihomestays.com' },
  },
  {
    name: 'Maya Thapa',
    role: 'Customer Success',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'Ensuring every guest has a memorable stay. Available 24/7 to assist with any needs.',
    social: { linkedin: '#', twitter: '#', email: 'maya@nepalihomestays.com' },
  },
  {
    name: 'Tenzing Sherpa',
    role: 'Trekking Expert',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Certified mountain guide with decades of Himalayan experience. Designs our adventure packages.',
    social: { linkedin: '#', twitter: '#', email: 'tenzing@nepalihomestays.com' },
  },
  {
    name: 'Priya Rai',
    role: 'Marketing Lead',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Storyteller at heart. Shares the beauty of Nepal through compelling content and campaigns.',
    social: { linkedin: '#', twitter: '#', email: 'priya@nepalihomestays.com' },
  },
];

const Team = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-12 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meet Our Team
            </h1>
            <p className="text-lg text-muted-foreground">
              The passionate people working to bring you authentic Nepali experiences
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl overflow-hidden border border-border group"
            >
              <div className="h-64 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-foreground">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                <div className="flex gap-3">
                  <a href={member.social.linkedin} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href={member.social.twitter} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href={`mailto:${member.social.email}`} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
</div>
  );
};

export default Team;