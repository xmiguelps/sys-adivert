import type { MouseEvent } from "react";

type TabelaProps = {
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
    assinada: boolean;
    id: number;
    selected: boolean;
    onRowSelect: (id: number, ctrl: boolean) => void;
    onToggleAssinatura: (id: number, assinada: boolean) => void;
}

function Tabela({ data, matricula, nome, tipo, motivo, assinada, id, selected, onRowSelect, onToggleAssinatura }: TabelaProps) {

    // Parse as local date to avoid UTC-offset shifting the day (e.g. UTC-3 turns
    // "2026-04-21T00:00:00Z" into "20/04/2026" instead of the correct "21/04/2026")
    const dataFormatada = (data: string) => {
        const [yyyy, mm, dd] = data.slice(0, 10).split('-')
        return `${dd}/${mm}/${yyyy}`
    }

    const truncarNome = (nome: string) => {
        const partes = nome.trim().split(/\s+/);
        return partes.slice(0, 3).join(' ');
    }

    const handleClick = (e: MouseEvent) => {
        onRowSelect(id, e.ctrlKey || e.metaKey)
    }

    return (
        <tbody>
            <tr
                className={`tabela-row ${selected ? 'tabela-row--selected' : ''}`}
                onClick={handleClick}
                title="Clique para selecionar (segure Ctrl para selecionar várias)"
            >
                <td className='adivert-dado data-dado'>{dataFormatada(data)}</td>
                <td className='adivert-dado'>{matricula}</td>
                <td className='adivert-dado nome-dado'>{truncarNome(nome)}</td>
                <td className='adivert-dado tipo-dado'>{tipo}</td>
                <td className='adivert-dado motivo-dado' title={motivo}>
                    {motivo}
                </td>
                <td
                    className='adivert-dado assinada-dado'
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        type='button'
                        className={`assinada-toggle ${assinada ? 'assinada-toggle--sim' : 'assinada-toggle--nao'}`}
                        onClick={() => onToggleAssinatura(id, !assinada)}
                        aria-pressed={assinada}
                        title={assinada ? 'Assinada — clique para desmarcar' : 'Pendente — clique para marcar como assinada'}
                    >
                        {assinada ? '✅ Assinada' : '⬜ Pendente'}
                    </button>
                </td>
            </tr>
        </tbody>
    )
}

export default Tabela
