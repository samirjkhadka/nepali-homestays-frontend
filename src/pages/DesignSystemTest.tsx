import { Mountain, Temple, PrayerFlags, Homestay, Trekking } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { colors, spacing, assets } from '@/lib/design-tokens';

export default function DesignSystemTest() {
  return (
    <div className="container mx-auto space-y-12 p-8">
      {/* Header with logo */}
      <div className="text-center">
        <img src={assets.logo} alt="Nepali Homestays" className="mx-auto h-20 w-auto" />
        <h1 className="mt-4 text-4xl font-bold text-primary-700">
          Nepali Homestays Design System
        </h1>
        <p className="mt-2 text-muted-foreground">
          Colors and assets from brand logo (navy #0F233E, orange #FB6F08 / #FFA101)
        </p>
      </div>

      {/* Colors */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Color Palette</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-xl font-semibold">Primary (Brand Navy from logo)</h3>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Object.entries(colors.primary).map(([shade, color]) => (
                <div key={shade} className="space-y-1">
                  <div
                    className="h-16 w-full rounded-lg border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center">{shade}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xl font-semibold">Secondary (Blue-gray)</h3>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Object.entries(colors.secondary).map(([shade, color]) => (
                <div key={shade} className="space-y-1">
                  <div
                    className="h-16 w-full rounded-lg border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center">{shade}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xl font-semibold">Accent (Logo Orange/Amber)</h3>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Object.entries(colors.accent).map(([shade, color]) => (
                <div key={shade} className="space-y-1">
                  <div
                    className="h-16 w-full rounded-lg border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center">{shade}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gradients */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Gradients</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-lg bg-gradient-nepal shadow-lg" />
          <div className="h-40 rounded-lg bg-gradient-hero shadow-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-white bg-gradient-nepal p-4 rounded-lg">
                Nepal Gradient
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-white bg-gradient-hero p-4 rounded-lg">
                Hero Gradient
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Nepal-Themed Icons</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
          <Card className="flex flex-col items-center justify-center p-6">
            <Mountain className="mb-2 h-16 w-16 text-primary-500" />
            <p className="text-sm font-medium">Mountain</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <Temple className="mb-2 h-16 w-16 text-primary-600" />
            <p className="text-sm font-medium">Temple</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <PrayerFlags className="mb-2 h-16 w-16 text-accent-500" />
            <p className="text-sm font-medium">Prayer Flags</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <Homestay className="mb-2 h-16 w-16 text-primary-600" />
            <p className="text-sm font-medium">Homestay</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <Trekking className="mb-2 h-16 w-16 text-secondary-600" />
            <p className="text-sm font-medium">Trekking</p>
          </Card>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Typography</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h1 className="text-5xl font-bold">Heading 1</h1>
              <p className="text-sm text-muted-foreground">48px / Bold</p>
            </div>
            <div>
              <h2 className="text-4xl font-semibold">Heading 2</h2>
              <p className="text-sm text-muted-foreground">36px / Semibold</p>
            </div>
            <div>
              <h3 className="text-3xl font-semibold">Heading 3</h3>
              <p className="text-sm text-muted-foreground">30px / Semibold</p>
            </div>
            <div>
              <h4 className="text-2xl font-semibold">Heading 4</h4>
              <p className="text-sm text-muted-foreground">24px / Semibold</p>
            </div>
            <div>
              <p className="text-lg">Body Large - Experience authentic Nepali culture</p>
              <p className="text-sm text-muted-foreground">18px / Regular</p>
            </div>
            <div>
              <p className="text-base">Body Base - Discover homestays across Nepal</p>
              <p className="text-sm text-muted-foreground">16px / Regular</p>
            </div>
            <div>
              <p className="text-sm">Body Small - Book your perfect stay</p>
              <p className="text-xs text-muted-foreground">14px / Regular</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Buttons</h2>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Mountain className="mr-2 h-4 w-4" />
                  Explore
                </Button>
                <Button variant="secondary">
                  <Homestay className="mr-2 h-4 w-4" />
                  Book Now
                </Button>
                <Button variant="outline">
                  <Temple className="mr-2 h-4 w-4" />
                  Discover
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-primary-500 hover:bg-primary-600 text-white">Navy</Badge>
          <Badge className="bg-secondary-500 hover:bg-secondary-600 text-white">Blue-gray</Badge>
          <Badge className="bg-accent-500 hover:bg-accent-600 text-white">Orange</Badge>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Cards</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A simple card with header and content.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary-500">
            <CardHeader className="bg-primary-50">
              <CardTitle className="text-primary-700">Navy Card</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Card with primary color accent.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-nepal text-white">
            <CardHeader>
              <CardTitle>Logo Gradient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/90">
                Navy → blue-gray → orange (from logo).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Form Elements</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Input</label>
              <Input placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Input placeholder="Search homestays..." className="pr-10" />
                <Mountain className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Spacing */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Spacing Scale</h2>
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Object.entries(spacing).map(([name, value]) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground w-16">{value}</span>
                <div
                  className="h-8 rounded bg-primary-500"
                  style={{ width: value }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
