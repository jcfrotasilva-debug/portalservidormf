import { redirect } from "next/navigation";
import { GestorShell } from "@/components/gestor/gestor-shell";
import { UsuariosGestor } from "@/components/gestor/usuarios-gestor";
import { listarGestores, perfilRotulo } from "@/lib/gestor";
import { gestorAdminDaSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuários gestores · SERVIDOR 360",
  robots: { index: false, follow: false },
};

export default async function PaginaUsuariosGestor() {
  const admin = await gestorAdminDaSessao();
  if (!admin) redirect("/gestor");

  const lista = await listarGestores();

  return (
    <GestorShell
      ativo="/gestor/usuarios"
      titulo="Usuários com acesso ao painel"
      descricao="Crie contas para cada pessoa da equipe, defina o perfil e redefina senhas. Não existe mais senha única: cada usuário entra com o próprio e-mail."
    >
      <UsuariosGestor
        meuId={admin.id}
        gestores={lista.map((gestor) => ({
          id: gestor.id,
          nome: gestor.nome,
          email: gestor.email,
          perfil: gestor.perfil,
          perfilRotulo: perfilRotulo(gestor.perfil),
          ativo: gestor.ativo,
          ultimoAcesso: gestor.ultimoAcesso ? gestor.ultimoAcesso.toISOString() : null,
          criadoEm: gestor.criadoEm.toISOString(),
        }))}
      />
    </GestorShell>
  );
}
