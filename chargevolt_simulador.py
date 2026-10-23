from datetime import datetime
import time
import uuid

# CONFIGURAÇÕES DO SISTEMA (Alinhadas com o App)

PRECO_KWH = 0.90
POWER_KW = 7.4
CO2_ECONOMIZADO_POR_KWH = 0.12
GOODWE_SHARE = 0.10
VENUE_SHARE = 0.90

# Simulação de Banco de Dados
db_usuarios = {}
db_recargas = []
db_agendamentos = []
db_qr_logs = []

usuario_logado = None
sensor_conectado = False
kwh_sensor = 0.0


# MÓDULOS DE AUTENTICAÇÃO E USUÁRIOS

def cadastrar_usuario():
    print("\n--- CADASTRO ---")
    nome = input("Nome completo: ").strip()
    email = input("Email: ").strip().lower()
    username = input("Usuário: ").strip()
    senha = input("Senha: ").strip()

    if username in db_usuarios:
        print("Usuário já existe.")
        return

    db_usuarios[username] = {
        "id": str(uuid.uuid4()),
        "nome": nome,
        "email": email,
        "senha": senha,
        "is_admin": False,
        "saldo": 0.0,
        "pontos": 0,
        "historico": []
    }
    print("Usuário cadastrado com sucesso!")


def login():
    global usuario_logado
    print("\n--- LOGIN ---")
    username = input("Usuário: ").strip()
    senha = input("Senha: ").strip()

    # Usuários padrão do App
    if username == "ADMIN" and senha == "admin123":
        usuario_logado = {"id": "admin-001", "nome": "ADMIN", "is_admin": True}
        print("Logado como ADMIN.")
        return True
    elif username == "demo" and senha == "123456":
        if "demo" not in db_usuarios:
            db_usuarios["demo"] = {"id": "demo-001", "nome": "Usuário Demo", "is_admin": False, "saldo": 100.0,
                                   "pontos": 0, "historico": []}
        usuario_logado = db_usuarios["demo"]
        usuario_logado["is_admin"] = False
        print("Logado como usuário DEMO.")
        return True
    elif username in db_usuarios and db_usuarios[username]["senha"] == senha:
        usuario_logado = db_usuarios[username]
        print(f"Logado como {usuario_logado['nome']}.")
        return True
    else:
        print("Credenciais inválidas.")
        return False


# MÓDULOS DE RECARGA E PAGAMENTO

def calcular_recarga():
    print("\n--- NOVA RECARGA ---")
    print("1 - Por KWh")
    print("2 - Por Tempo")
    opcao = input("Escolha o modo: ")

    if opcao == "1":
        kwh = float(input("Quantidade de KWh desejada: "))
        duracao_min = round((kwh / POWER_KW) * 60)
    else:
        horas = float(input("Horas: "))
        minutos = float(input("Minutos: "))
        duracao_min = (horas * 60) + minutos
        kwh = round((duracao_min / 60) * POWER_KW, 2)

    custo_total = round(kwh * PRECO_KWH, 2)
    goodwe_share = round(custo_total * GOODWE_SHARE, 2)
    venue_share = round(custo_total * VENUE_SHARE, 2)

    print(f"\nResumo: {kwh} KWh | Duração: {duracao_min} min | Total: R$ {custo_total:.2f}")
    print(f"Divisão: GoodWe R$ {goodwe_share:.2f} | Estabelecimento R$ {venue_share:.2f}")

    confirmar = input("Confirmar pagamento? (s/n): ").lower()
    if confirmar == 's':
        # Simula pagamento
        metodo = input("Método (pix/debito/credito/plano): ")
        iniciar_monitoramento(kwh, custo_total, duracao_min, metodo, goodwe_share, venue_share)
    else:
        print("Recarga cancelada.")


def iniciar_monitoramento(kwh, custo, duracao, metodo, goodwe_share, venue_share):
    print("\n===== RECARGA EM ANDAMENTO =====")
    print("Status: Preparando...")
    time.sleep(1)

    carregado = 0

    passos = 10
    for i in range(1, passos + 1):
        time.sleep(1)
        carregado = (kwh / passos) * i
        porcentagem = (i / passos) * 100
        status = "Carregando" if porcentagem < 80 else ("Quase concluído" if porcentagem < 100 else "Concluído")
        print(f"Status: {status} | {porcentagem:.0f}% | {carregado:.2f}/{kwh} KWh")

    finalizar_recarga(kwh, custo, metodo, goodwe_share, venue_share)


def finalizar_recarga(kwh, custo, metodo, goodwe_share, venue_share):
    global usuario_logado
    data_atual = datetime.now().isoformat()
    charge_id = str(uuid.uuid4())

    recarga = {
        "id": charge_id,
        "user_id": usuario_logado["id"],
        "kwh_delivered": kwh,
        "total_cost": custo,
        "payment_method": metodo,
        "status": "completed",
        "goodwe_share": goodwe_share,
        "venue_share": venue_share,
        "completed_at": data_atual
    }
    db_recargas.append(recarga)

    if "historico" in usuario_logado:
        usuario_logado["historico"].append(recarga)

# Adiciona pontos (1 ponto a cada R$ 5)

        pontos = int(custo / 5)
        usuario_logado["pontos"] += pontos

    co2 = kwh * CO2_ECONOMIZADO_POR_KWH
    print("\n===== RECARGA CONCLUÍDA =====")
    print(f"Valor pago: R$ {custo:.2f}")
    print(f"CO₂ evitado: {co2:.2f} kg")
    print("Obrigada por utilizar nossas recargas!")


# MÓDULOS DE AGENDAMENTO

def agendar_recarga():
    print("\n--- AGENDAR RECARGA ---")
    data = input("Data (AAAA-MM-DD): ")
    hora = input("Horário (HH:MM): ")
    kwh = float(input("KWh desejados: "))
    custo = round(kwh * PRECO_KWH, 2)

    agendamento = {
        "id": str(uuid.uuid4()),
        "user_id": usuario_logado["id"],
        "scheduled_date": data,
        "scheduled_time": hora,
        "kwh_requested": kwh,
        "estimated_cost": custo,
        "status": "scheduled"
    }
    db_agendamentos.append(agendamento)
    print(f"Agendamento confirmado para {data} às {hora}. Custo estimado: R$ {custo:.2f}")


# MÓDULO ADMINISTRATIVO E SENSOR

def dashboard_admin():
    print("\n===== DASHBOARD ADMINISTRATIVO =====")
    total_kwh = sum(r["kwh_delivered"] for r in db_recargas)
    receita_total = sum(r["total_cost"] for r in db_recargas)
    goodwe_total = sum(r["goodwe_share"] for r in db_recargas)
    venue_total = sum(r["venue_share"] for r in db_recargas)
    co2_total = total_kwh * CO2_ECONOMIZADO_POR_KWH

    print(f"Total de Recargas: {len(db_recargas)}")
    print(f"Energia Total: {total_kwh:.2f} KWh")
    print(f"Receita Total: R$ {receita_total:.2f}")
    print(f"  - GoodWe (10%): R$ {goodwe_total:.2f}")
    print(f"  - Estabelecimento (90%): R$ {venue_total:.2f}")
    print(f"Agendamentos Ativos: {len([a for a in db_agendamentos if a['status'] == 'scheduled'])}")
    print(f"CO₂ Evitado: {co2_total:.2f} kg")


def simular_sensor():
    global sensor_conectado, kwh_sensor
    print("\n===== SIMULAÇÃO DE SENSOR =====")
    print(f"Status: {'Conectado' if sensor_conectado else 'Desconectado'}")
    print(f"KWh transferidos: {kwh_sensor:.2f}")
    print("1 - Conectar Estação")
    print("2 - Adicionar 1.5 KWh")
    print("3 - Desconectar Estação")
    opcao = input("Escolha: ")

    if opcao == "1":
        sensor_conectado = True
        kwh_sensor = 0
        print("Estação conectada. Veículo detectado.")
    elif opcao == "2":
        if sensor_conectado:
            kwh_sensor += 1.5
            print(f"KWh atualizado: {kwh_sensor}")
        else:
            print("Conecte a estação primeiro.")
    elif opcao == "3":
        sensor_conectado = False
        kwh_sensor = 0
        print("Estação desconectada.")


# MENU PRINCIPAL

def main():
    global usuario_logado

    while True:
        print("\n===== CHARGEVOLT - SIMULATOR =====")
        if usuario_logado:
            role = "ADMIN" if usuario_logado.get("is_admin") else "USUÁRIO"
            print(f"Logado: {usuario_logado['nome']} ({role})")

        print("1 - Cadastrar Usuário")
        print("2 - Login")

        if usuario_logado:
            if usuario_logado.get("is_admin"):
                print("3 - Dashboard Administrativo")
                print("4 - Simular Sensor de Hardware")
                print("5 - Logout")
            else:
                print("3 - Nova Recarga")
                print("4 - Agendar Recarga")
                print("5 - Ver Histórico")
                print("6 - Logout")
        print("0 - Sair")

        opcao = input("Escolha: ")

        if opcao == "1":
            cadastrar_usuario()
        elif opcao == "2":
            login()
        elif opcao == "3":
            if usuario_logado and usuario_logado.get("is_admin"):
                dashboard_admin()
            elif usuario_logado:
                calcular_recarga()
        elif opcao == "4":
            if usuario_logado and usuario_logado.get("is_admin"):
                simular_sensor()
            elif usuario_logado:
                agendar_recarga()
        elif opcao == "5":
            if usuario_logado:
                if usuario_logado.get("is_admin"):
                    usuario_logado = None
                    print("Logout realizado.")
                else:
                    print("\n--- HISTÓRICO ---")
                    for r in usuario_logado.get("historico", []):
                        print(f"{r['completed_at'][:10]} - {r['kwh_delivered']} KWh - R$ {r['total_cost']:.2f}")
        elif opcao == "6" and usuario_logado and not usuario_logado.get("is_admin"):
            usuario_logado = None
            print("Logout realizado.")
        elif opcao == "0":
            break


if __name__ == "__main__":
    main()
