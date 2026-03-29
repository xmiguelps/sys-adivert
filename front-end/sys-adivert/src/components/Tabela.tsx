function Tabela() {
    return (
        <>
        <table className='adivert'>
            <thead>
                <tr>
                    <th className='adivert-column' id='data'>Data</th>
                    <th className='adivert-column' id='matricula'>Matricula</th>
                    <th className='adivert-column' id='nome'>Nome</th>
                    <th className='adivert-column' id='tipo'>Tipo</th>
                    <th className='adivert-column' id='motivo'>Motivo</th>
                    <th className='adivert-column' id='actions'>Ações</th>
                </tr>
            </thead>
            <tbody className="">
                <tr>
                    <td className='adivert-dado data-dado'>23/03/2026</td>
                    <td className='adivert-dado'>16149</td>
                    <td className='adivert-dado'>THIAGO LUCIUS MARTINS</td>
                    <td className='adivert-dado'>Escrita</td>
                    <td className='adivert-dado'>Falta sem justificativa no dia</td>
                    <td className='adivert-dado box-actions-buttons'>
                        <button className='actions-buttons'><img className='icon' src="src/assets/lixeira.png" alt="icone-lixeira"/></button>
                        <button className='actions-buttons'><img className='icon' src="src/assets/edit.png" alt="icone-edit " /></button>
                        <button className='actions-buttons'><img className='icon' src="src/assets/download-file.png" alt="icone-download-arquivo"/></button>
                    </td>
                </tr>
            </tbody>
        </table>
        </>
    )
}



export default Tabela