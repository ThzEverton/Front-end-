import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import {
  Sparkles,
  Heart,
  Shield,
  Star,
  Clock,
  ChevronDown,
  ArrowRight,
  MessageCircle,
} from 'lucide-react'

const servicos = [
  {
    icon: Sparkles,
    nome: 'Consultoria de Imagem',
    desc: 'Análise personalizada de estilo, coloração e identidade visual para realçar sua beleza única.',
  },
  {
    icon: Heart,
    nome: 'Tratamentos Estéticos',
    desc: 'Procedimentos faciais e corporais com produtos premium para cuidar de você por completo.',
  },
  {
    icon: Star,
    nome: 'Maquiagem Profissional',
    desc: 'Make para eventos, noivas e ocasiões especiais com técnicas modernas e duradouras.',
  },
  {
    icon: Shield,
    nome: 'Treinamento para Consultoras',
    desc: 'Capacitação exclusiva para mulheres que desejam empreender na área de beleza.',
  },
]

const beneficios = [
  {
    titulo: 'Ambiente Exclusivo',
    desc: 'Espaço pensado para você se sentir em casa, com toda a privacidade que merece.',
  },
  {
    titulo: 'Equipe Especializada',
    desc: 'Profissionais certificadas e em constante atualização para oferecer o melhor.',
  },
  {
    titulo: 'Agendamento Fácil',
    desc: 'Marque seu horário em minutos pelo nosso sistema online, 24 horas por dia.',
  },
  {
    titulo: 'Produtos Premium',
    desc: 'Trabalhamos apenas com marcas selecionadas, seguras e de alta performance.',
  },
]

const faqs = [
  {
    q: 'Como funciona o agendamento?',
    a: 'Após criar sua conta, você acessa o sistema, escolhe o serviço desejado, visualiza os horários disponíveis e confirma o agendamento em poucos cliques.',
  },
  {
    q: 'Posso cancelar ou remarcar?',
    a: 'Sim! Cancelamentos e remarcações são permitidos até 23h59 do dia anterior ao atendimento (D-2). Após esse prazo, entre em contato pelo WhatsApp.',
  },
  {
    q: 'O que é uma consultora?',
    a: 'Consultoras são clientes especiais que passaram por nosso programa de capacitação e têm acesso a serviços exclusivos e condições diferenciadas.',
  },
  {
    q: 'Atendimento em grupo é possível?',
    a: 'Sim! Oferecemos atendimentos em turma para grupos de 2 a 5 pessoas com duração de 2 horas.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos dinheiro, cartão de débito/crédito e PIX. O pagamento pode ser realizado presencialmente.',
  },
]

function FaqItem({ q, a }) {
  return (
    <details className="group border border-border rounded-lg bg-card">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-foreground">
        {q}
        <ChevronDown
          size={18}
          className="text-primary transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
    </details>
  )
}

const WHATSAPP_NUMBER = '5500000000000' // TODO: trocar pelo número real da Sala Rosa
const WHATSAPP_MSG = encodeURIComponent(
  'Olá! Tenho interesse em ser consultora da Sala Rosa. Poderia me enviar mais informações?'
)
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center justify-center pt-16"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-sm tracking-widest text-rose-200 uppercase mb-4 font-body">
            Bem-vinda ao seu espaço
          </p>
          <h1 className="font-sans text-5xl md:text-7xl font-bold text-white mb-6 text-balance leading-tight">
            Sala Rosa
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed font-body max-w-xl mx-auto">
            Um espaço exclusivo de beleza, bem-estar e cuidado feminino. Agende
            seu atendimento e descubra uma nova versão de você.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Agendar agora <ArrowRight size={16} />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={16} /> Quero ser consultora
            </a>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest text-primary uppercase font-body mb-2">
              O que oferecemos
            </p>
            <h2 className="font-sans text-4xl font-bold text-foreground text-balance">
              Nossos Serviços
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicos.map((s) => (
              <div
                key={s.nome}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-11 h-11 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <s.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-sans text-lg font-semibold text-card-foreground mb-2">
                  {s.nome}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-24 px-6 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest text-primary uppercase font-body mb-2">
              Por que nos escolher
            </p>
            <h2 className="font-sans text-4xl font-bold text-foreground text-balance">
              Nossos Diferenciais
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beneficios.map((b, i) => (
              <div
                key={b.titulo}
                className="flex gap-4 bg-card border border-border rounded-xl p-6"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold font-body">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-sans text-lg font-semibold text-card-foreground mb-1">
                    {b.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-body">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Consultora */}
      <section className="py-24 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <Clock size={40} className="text-primary-foreground mx-auto mb-6 opacity-80" />
          <h2 className="font-sans text-4xl font-bold text-primary-foreground mb-4 text-balance">
            Quer fazer parte do time?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg font-body leading-relaxed">
            Torne-se uma consultora da Sala Rosa e tenha acesso a treinamentos
            exclusivos, produtos com desconto e uma comunidade de mulheres
            incríveis.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={18} /> Quero ser consultora
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest text-primary uppercase font-body mb-2">
              Dúvidas frequentes
            </p>
            <h2 className="font-sans text-4xl font-bold text-foreground text-balance">
              Perguntas e Respostas
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-sans text-lg font-bold text-primary">Sala Rosa</span>
          <p className="text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} Sala Rosa. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground font-body">
            <Link href="/login" className="hover:text-primary transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="hover:text-primary transition-colors">
              Cadastrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
