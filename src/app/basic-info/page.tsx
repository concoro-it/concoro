"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EducationSection } from "@/components/profile/EducationSection"
import { ExperienceSection } from "@/components/profile/ExperienceSection"
import { doc, getDoc, setDoc, Timestamp, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"
import { X, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { BrandColumn } from '@/components/auth/BrandColumn'
import { User, sendEmailVerification } from "firebase/auth"
import type { Experience, UserProfile } from "@/types"
import { brevoClient } from "@/lib/services/brevoClient"

// Italian regions
const ITALIAN_REGIONS = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
]

// Region to cities mapping
const REGION_CITIES = {
  "Abruzzo": ["L'Aquila", "Pescara", "Chieti", "Teramo"],
  "Basilicata": ["Potenza", "Matera"],
  "Calabria": ["Catanzaro", "Reggio Calabria", "Cosenza", "Crotone", "Vibo Valentia"],
  "Campania": ["Napoli", "Salerno", "Caserta", "Avellino", "Benevento"],
  "Emilia-Romagna": ["Bologna", "Modena", "Parma", "Reggio Emilia", "Ravenna", "Ferrara", "Forlì", "Rimini", "Piacenza"],
  "Friuli-Venezia Giulia": ["Trieste", "Udine", "Pordenone", "Gorizia"],
  "Lazio": ["Roma", "Latina", "Frosinone", "Rieti", "Viterbo"],
  "Liguria": ["Genova", "La Spezia", "Savona", "Imperia"],
  "Lombardia": ["Milano", "Brescia", "Bergamo", "Monza", "Pavia", "Cremona", "Mantova", "Varese", "Como", "Lecco", "Lodi", "Sondrio"],
  "Marche": ["Ancona", "Pesaro", "Macerata", "Ascoli Piceno", "Fermo"],
  "Molise": ["Campobasso", "Isernia"],
  "Piemonte": ["Torino", "Alessandria", "Asti", "Biella", "Cuneo", "Novara", "Verbania", "Vercelli"],
  "Puglia": ["Bari", "Brindisi", "Foggia", "Lecce", "Taranto", "Andria", "Barletta"],
  "Sardegna": ["Cagliari", "Sassari", "Nuoro", "Oristano", "Olbia", "Carbonia"],
  "Sicilia": ["Palermo", "Catania", "Messina", "Siracusa", "Trapani", "Agrigento", "Caltanissetta", "Enna", "Ragusa"],
  "Toscana": ["Firenze", "Pisa", "Livorno", "Arezzo", "Siena", "Prato", "Grosseto", "Lucca", "Pistoia", "Massa"],
  "Trentino-Alto Adige": ["Trento", "Bolzano", "Merano", "Rovereto"],
  "Umbria": ["Perugia", "Terni", "Foligno", "Città di Castello", "Assisi"],
  "Valle d'Aosta": ["Aosta", "Courmayeur", "Saint-Vincent"],
  "Veneto": ["Venezia", "Verona", "Padova", "Vicenza", "Treviso", "Rovigo", "Belluno"]
}

// Professional sectors
const PROFESSIONAL_SECTORS = [
  "Amministrazione",
  "Ingegneria",
  "Informatica",
  "Medicina",
  "Economia",
  "Giurisprudenza",
  "Architettura",
  "Scienze",
  "Istruzione",
  "Ricerca",
  "Ambiente",
  "Cultura",
  "Sociale",
  "Sicurezza",
  "Trasporti"
]

interface Education {
  id: string;
  fieldOfStudy: string;
  schoolName: string;
  degree: string;
  startDate: Timestamp;
  endDate: Timestamp | null;
  isCurrent: boolean;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  region?: string;
  city?: string;
  education?: string;
  experience?: string;
  sectors?: string;
  regions?: string;
}

// Validation messages
const VALIDATION_MESSAGES = {
  firstName: "Il nome è obbligatorio",
  lastName: "Il cognome è obbligatorio", 
  region: "La regione è obbligatoria",
  city: "La città è obbligatoria",
  education: "Almeno un'istruzione è obbligatoria",
  experience: "Almeno un'esperienza è obbligatoria",
  sectors: "Almeno un settore di interesse è obbligatorio",
  regions: "Almeno una regione preferita è obbligatoria"
}

// Step configuration
const STEPS = [
  { id: 1, title: "Informazioni Personali", description: "Nome, cognome, regione e città" },
  { id: 2, title: "Informazioni sull'istruzione", description: "La tua formazione" },
  { id: 3, title: "Informazioni sull'esperienza", description: "La tua esperienza lavorativa" },
  { id: 4, title: "Interessi", description: "Settori di interesse e regioni preferite" }
]

export default function BasicInfoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [dismissedEmailAlert, setDismissedEmailAlert] = useState(false)
  const [education, setEducation] = useState<Education[]>([])
  const [experience, setExperience] = useState<Experience[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [region, setRegion] = useState("")
  const [city, setCity] = useState("")
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [verificationEmailSent, setVerificationEmailSent] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Validation function for current step
  const validateCurrentStep = (): FieldErrors => {
    const errors: FieldErrors = {}

    switch (currentStep) {
      case 1: // Personal Info
        if (!firstName.trim()) {
          errors.firstName = VALIDATION_MESSAGES.firstName
        }
        if (!lastName.trim()) {
          errors.lastName = VALIDATION_MESSAGES.lastName
        }
        if (!region) {
          errors.region = VALIDATION_MESSAGES.region
        }
        if (!city && region) {
          errors.city = VALIDATION_MESSAGES.city
        }
        break

      case 2: // Education
        if (education.length === 0) {
          errors.education = VALIDATION_MESSAGES.education
        }
        break

      case 3: // Experience
        if (experience.length === 0) {
          errors.experience = VALIDATION_MESSAGES.experience
        }
        break

      case 4: // Interests
        if (selectedSectors.length === 0) {
          errors.sectors = VALIDATION_MESSAGES.sectors
        }
        if (selectedRegions.length === 0) {
          errors.regions = VALIDATION_MESSAGES.regions
        }
        break
    }

    return errors
  }

  // Clear specific field error when user starts typing/selecting
  const clearFieldError = (fieldName: keyof FieldErrors) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }))
    }
  }

  // Handle region selection and update available cities
  const handleRegionChange = (selectedRegion: string) => {
    setRegion(selectedRegion)
    setCity("") // Reset city when region changes
    setAvailableCities(REGION_CITIES[selectedRegion as keyof typeof REGION_CITIES] || [])
    clearFieldError('region')
    clearFieldError('city') // Clear city error when region changes
  }

  // Handle city selection
  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity)
    clearFieldError('city')
  }

  // Handle step navigation
  const handleNextStep = () => {
    const errors = validateCurrentStep()
    setFieldErrors(errors)

    if (Object.keys(errors).length === 0) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
        setFieldErrors({}) // Clear errors when moving to next step
      }
    } else {
      toast.error("Per favore completa tutti i campi richiesti")
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFieldErrors({}) // Clear errors when going back
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/signin")
      return
    }

    // Check if user has already completed the basic info
    const checkBasicInfo = async () => {
      try {
        if (!db) return;
        const userProfileRef = doc(db, "userProfiles", user.uid)
        const profileSnap = await getDoc(userProfileRef)
        
        if (profileSnap.exists()) {
          const data = profileSnap.data()
          
          // Pre-fill existing data if any
          if (data.firstName) {
            setFirstName(data.firstName)
          }
          if (data.lastName) {
            setLastName(data.lastName)
          }
          if (data.region) {
            setRegion(data.region)
            // Set available cities for the pre-filled region
            setAvailableCities(REGION_CITIES[data.region as keyof typeof REGION_CITIES] || [])
          }
          if (data.city) {
            setCity(data.city)
          }
          if (data.SettoriInteresse) {
            setSelectedSectors(data.SettoriInteresse)
          }
          if (data.RegioniPreferite) {
            setSelectedRegions(data.RegioniPreferite)
          }
          if (Array.isArray(data.education) && data.education.length > 0) {
            setEducation(data.education.map((edu: any) => ({
              id: edu.id || "current",
              fieldOfStudy: edu.fieldOfStudy || "",
              schoolName: edu.schoolName || "",
              degree: edu.degree || "",
              startDate: edu.startDate || Timestamp.now(),
              endDate: edu.endDate || null,
              isCurrent: edu.isCurrent || false
            })))
          }
          if (Array.isArray(data.experience) && data.experience.length > 0) {
            setExperience(data.experience.map((exp: any) => ({
              id: exp.id || crypto.randomUUID(),
              positionTitle: exp.positionTitle || exp.jobTitle || "",
              companyName: exp.companyName || exp.company || "",
              location: exp.location || "",
              startDate: exp.startDate || Timestamp.now(),
              endDate: exp.endDate || null,
              isCurrent: exp.isCurrent || false,
              skills: exp.skills || []
            })))
          }
          
          // Only redirect if all required fields are completed
          const hasEducation = data.education?.length > 0
          const hasExperience = data.experience?.length > 0
          const hasSectors = data.SettoriInteresse?.length > 0
          const hasRegions = data.RegioniPreferite?.length > 0
          const hasName = data.firstName && data.lastName
          const hasLocation = data.region && data.city

          if (hasEducation && hasExperience && hasSectors && hasRegions && hasName && hasLocation && user.emailVerified) {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Error checking basic info:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkBasicInfo()
  }, [user, router])

  const handleSendVerificationEmail = async () => {
    try {
      if (user) {
        await sendEmailVerification(user)
        setVerificationEmailSent(true)
        toast.success("Email di verifica inviata con successo")
      }
    } catch (error) {
      console.error("Error sending verification email:", error)
      toast.error("Errore nell'invio dell'email di verifica")
    }
  }

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    )
    clearFieldError('sectors')
  }

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
    clearFieldError('regions')
  }

  const handleEducationUpdate = (newEducation: Education[]) => {
    setEducation(newEducation)
    clearFieldError('education')
  }

  const handleExperienceUpdate = (newExperience: Experience[]) => {
    setExperience(newExperience)
    clearFieldError('experience')
  }

  const handleSubmit = async () => {
    if (!user || !db) return

    if (!user.emailVerified) {
      toast.error("Per favore verifica la tua email prima di continuare")
      return
    }

    // Validate final step
    const errors = validateCurrentStep()
    setFieldErrors(errors)

    // If there are validation errors, prevent submission
    if (Object.keys(errors).length > 0) {
      toast.error("Per favore correggi gli errori nel modulo")
      return
    }

    try {
      setIsLoading(true)

      // Create the user profile document
      const userProfileRef = doc(db, "userProfiles", user.uid)
      await setDoc(userProfileRef, {
        email: user.email,
        RegioniPreferite: selectedRegions,
        SettoriInteresse: selectedSectors,
        backgroundImageURL: "",
        bio: "",
        contactInfo: {
          email: user.email,
          phone: ""
        },
        createdAt: Timestamp.now(),
        currentCompany: "",
        education: education.map(edu => ({
          id: edu.id || crypto.randomUUID(),
          fieldOfStudy: edu.fieldOfStudy || "",
          schoolName: edu.schoolName || "",
          degree: edu.degree || "",
          startDate: edu.startDate || Timestamp.now(),
          endDate: edu.endDate || null,
          isCurrent: edu.isCurrent || false,
        })),
        experience: experience.map(exp => ({
          id: exp.id || crypto.randomUUID(),
          positionTitle: exp.positionTitle || "",
          companyName: exp.companyName || "",
          location: exp.location || "",
          startDate: exp.startDate || Timestamp.now(),
          endDate: exp.endDate || null,
          isCurrent: exp.isCurrent || false,
          skills: exp.skills || []
        })),
        firstName: firstName.trim(),
        jobTitle: "",
        languages: [],
        lastName: lastName.trim(),
        licensesCertifications: [],
        location: selectedRegions[0] || "",
        region: region,
        city: city,
        profileImageURL: "",
        publications: [],
        updatedAt: Timestamp.now(),
        volunteering: []
      }, { merge: true })

      // Create UserProfile object for Brevo sync
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        region: region,
        city: city,
        isStudent: selectedSectors.some(sector => 
          ["Istruzione", "Ricerca", "Università"].includes(sector)
        ),
        headline: '',
        currentPosition: experience.length > 0 ? experience[0].positionTitle : '',
        currentCompany: experience.length > 0 ? experience[0].companyName : '',
        location: `${city}, ${region}`,
        about: '',
        profilePicture: null,
        backgroundImage: null,
        website: null,
        customProfileUrl: null,
        phone: null,
        experience: experience.map(exp => ({
          ...exp,
          id: exp.id || crypto.randomUUID()
        })),
        education: education.map(edu => ({
          ...edu,
          id: edu.id || crypto.randomUUID()
        })),
        certifications: [],
        volunteering: [],
        publications: [],
        skills: [],
        languages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        contactInfo: {
          email: user.email || '',
          phone: ''
        }
      };

      // Sync with Brevo and send welcome email
      try {
        console.log('Syncing profile completion with Brevo...');
        const brevoResult = await brevoClient.syncProfileCompletion(userProfile);
        
        if (brevoResult.success) {
          console.log('Profile synced with Brevo and welcome email sent successfully');
          if (brevoResult.data?.welcomeEmail) {
            if (brevoResult.data.welcomeEmail.error) {
              console.warn('Welcome email failed but sync succeeded:', brevoResult.data.welcomeEmail.error);
            } else {
              console.log('Welcome email sent successfully');
            }
          }
        } else {
          console.warn('Failed to sync with Brevo:', brevoResult.error);
          // Don't block the user flow, just log the error
        }
      } catch (brevoError) {
        console.error('Brevo sync error:', brevoError);
        // Don't block the user flow, just log the error
      }

      toast.success("Profilo aggiornato con successo")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Errore nel salvataggio del profilo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!user) return

    setIsCheckingVerification(true)
    try {
      // Force refresh the user to get the latest emailVerified status
      await user.reload()
      
      if (!user.emailVerified) {
        toast.error("Per favore verifica la tua email prima di continuare")
        return
      }

      // If verified, continue with the flow
      router.refresh()
    } catch (error) {
      console.error("Error checking verification status:", error)
      toast.error("Errore nel controllo dello stato di verifica")
    } finally {
      setIsCheckingVerification(false)
    }
  }

  if (!user || isChecking) {
    return null
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen flex">
        <BrandColumn />

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold">Verifica la tua email</h2>
            
            <Alert className="mb-4">
              <AlertDescription>
                Per accedere all'applicazione, è necessario verificare il tuo indirizzo email.
                {verificationEmailSent && (
                  <span className="block mt-2">
                    Abbiamo inviato un'email di verifica a {user.email}. 
                    Controlla la tua casella di posta e clicca sul link di verifica.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={handleSendVerificationEmail}
                disabled={verificationEmailSent}
                variant="outline"
                className="w-full"
              >
                {verificationEmailSent ? "Email inviata" : "Invia email di verifica"}
              </Button>

              <Button
                onClick={handleContinue}
                disabled={isCheckingVerification}
                className="w-full"
              >
                {isCheckingVerification ? "Verifica in corso..." : "Continua"}
              </Button>

              {verificationEmailSent && (
                <p className="text-sm text-muted-foreground">
                  Non hai ricevuto l'email? Controlla la cartella spam o{" "}
                  <button 
                    onClick={handleSendVerificationEmail}
                    className="text-primary hover:underline"
                  >
                    invia nuovamente
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informazioni Personali</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome*</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    clearFieldError('firstName')
                  }}
                  placeholder="Il tuo nome"
                  required
                  className={fieldErrors.firstName ? 'border-destructive' : ''}
                />
                {fieldErrors.firstName && (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Cognome*</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    clearFieldError('lastName')
                  }}
                  placeholder="Il tuo cognome"
                  required
                  className={fieldErrors.lastName ? 'border-destructive' : ''}
                />
                {fieldErrors.lastName && (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Regione*</Label>
                <Select value={region} onValueChange={handleRegionChange}>
                  <SelectTrigger className={fieldErrors.region ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleziona la tua regione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITALIAN_REGIONS.map((regionName) => (
                      <SelectItem key={regionName} value={regionName}>
                        {regionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.region && (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.region}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Città*</Label>
                <Select 
                  value={city} 
                  onValueChange={handleCityChange}
                  disabled={!region || availableCities.length === 0}
                >
                  <SelectTrigger 
                    className={`${fieldErrors.city ? 'border-destructive' : ''} ${
                      !region || availableCities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <SelectValue 
                      placeholder={
                        !region 
                          ? "Prima seleziona una regione" 
                          : "Seleziona la tua città"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.city && (
                  <p className="text-sm font-medium text-destructive">
                    {fieldErrors.city}
                  </p>
                )}
                {!region && (
                  <p className="text-sm text-muted-foreground">
                    Seleziona prima una regione per abilitare la scelta della città
                  </p>
                )}
              </div>
            </div>
          </Card>
        )

      case 2:
        return (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informazioni sull'istruzione</h2>
            <div>
              <EducationSection
                education={education}
                onUpdate={handleEducationUpdate}
              />
              {fieldErrors.education && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {fieldErrors.education}
                </p>
              )}
            </div>
          </Card>
        )

      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informazioni sull'esperienza</h2>
            <div>
              <ExperienceSection
                experience={experience}
                onUpdate={handleExperienceUpdate}
              />
              {fieldErrors.experience && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {fieldErrors.experience}
                </p>
              )}
            </div>
          </Card>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Settori di interesse</h2>
              <div className="flex flex-wrap gap-2">
                {PROFESSIONAL_SECTORS.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSectors.includes(sector) ? "default" : "outline"}
                    onClick={() => handleSectorToggle(sector)}
                    className="text-sm"
                  >
                    {sector}
                  </Button>
                ))}
              </div>
              {fieldErrors.sectors && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {fieldErrors.sectors}
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Regioni preferite</h2>
              <div className="flex flex-wrap gap-2">
                {ITALIAN_REGIONS.map((region) => (
                  <Button
                    key={region}
                    variant={selectedRegions.includes(region) ? "default" : "outline"}
                    onClick={() => handleRegionToggle(region)}
                    className="text-sm"
                  >
                    {region}
                  </Button>
                ))}
              </div>
              {fieldErrors.regions && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {fieldErrors.regions}
                </p>
              )}
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex">
      <BrandColumn />

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Completa il tuo profilo</h2>
            <p className="text-muted-foreground">
              {STEPS[currentStep - 1]?.description}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step title */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold">
              {STEPS[currentStep - 1]?.title}
            </h3>
          </div>

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNextStep}
                className="flex items-center gap-2"
              >
                Avanti
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? "Salvataggio..." : "Completa profilo"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 