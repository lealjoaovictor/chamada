// Valores de furtividade que a sala de teste (`?gym`) ajusta ao vivo. O jogo normal usa os padrões abaixo.
export const TUNING = {
  /** Segundos que o segurança leva, vendo o jogador, para pegá-lo. */
  reacao: 0.85,
  /** Quanto o alerta baixa por segundo depois que ele perde o jogador de vista. */
  esquecer: 0.45,
  /** Quanto a silhueta encolhe agachado (0,25 = 25% mais baixa para a visão do segurança). */
  agachadoAltura: 0.25,
  /** Velocidade andando agachado (m/s). */
  agachadoVelocidade: 2.4,
};
