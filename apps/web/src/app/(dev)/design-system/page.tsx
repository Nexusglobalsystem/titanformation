import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  PasswordInput,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@titan-kinetic/ui";

export const metadata = { title: "Design system — Titan Kinetic" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

function Primitives() {
  return (
    <div className="flex flex-col gap-10">
      <Section title="Boutons">
        <Button variant="primary">Primaire</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="outline">Contour</Button>
        <Button variant="ghost">Discret</Button>
        <Button variant="destructive">Destructeur</Button>
        <Button variant="primary" loading>
          Chargement
        </Button>
        <Button variant="primary" disabled>
          Désactivé
        </Button>
      </Section>

      <Section title="Champs de saisie">
        <Input label="Email" placeholder="vous@exemple.fr" className="w-64" />
        <PasswordInput label="Mot de passe" hint="8 caractères minimum" className="w-64" />
        <Input label="Champ en erreur" error="Ce champ est requis." className="w-64" />
        <Input label="Désactivé" disabled placeholder="—" className="w-64" />
      </Section>

      <Section title="Badges">
        <Badge variant="featured">Mise en avant</Badge>
        <Badge variant="neutral">Neutre</Badge>
        <Badge variant="success">Confirmé</Badge>
        <Badge variant="warning">En attente</Badge>
        <Badge variant="error">Refusé</Badge>
      </Section>

      <Section title="Cartes">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Formation</CardTitle>
            <CardDescription>Management d'équipe — 21h</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-body text-sm text-foreground-muted">
              Blended : classes virtuelles et modules asynchrones.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="primary" size="sm">
              Voir la fiche
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Tableau">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apprenant</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Claire Dubois</TableCell>
              <TableCell>FORM-2026-014</TableCell>
              <TableCell>
                <Badge variant="success">Confirmé</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Karim Haddad</TableCell>
              <TableCell>FORM-2026-014</TableCell>
              <TableCell>
                <Badge variant="warning">En attente</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Tableau — état vide">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apprenant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty colSpan={2}>Aucune inscription pour le moment.</TableEmpty>
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="flex flex-col gap-16 p-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Design system — Titan Kinetic
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Primitives construites à partir des tokens extraits des maquettes Stitch,
          en thème clair et sombre forcés (indépendants du thème système) pour
          comparaison directe.
        </p>
      </header>

      <div data-theme="light" className="rounded-xl border border-border bg-background p-8">
        <h2 className="mb-8 font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          Thème clair
        </h2>
        <Primitives />
      </div>

      <div data-theme="dark" className="rounded-xl border border-border bg-background p-8">
        <h2 className="mb-8 font-mono-label text-xs uppercase tracking-wide text-foreground-muted">
          Thème sombre
        </h2>
        <Primitives />
      </div>
    </main>
  );
}
