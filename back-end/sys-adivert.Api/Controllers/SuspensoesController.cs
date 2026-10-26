using Microsoft.AspNetCore.Mvc;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Service;
using sys_adivert.Application.Suspensoes.Dtos;

[ApiController]
[Route("api/[controller]")]
public class SuspensoesController : ControllerBase
{
    private readonly ISuspensaoService _service;

    public SuspensoesController(ISuspensaoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? matricula,
        [FromQuery] string? nome,
        [FromQuery] string[]? motivos,
        [FromQuery] DateOnly? de,
        [FromQuery] DateOnly? ate,
        CancellationToken cancellationToken)
    {
        var filtro = RegistroFiltro.Criar(matricula, nome, motivos, de, ate);
        return Ok(await _service.GetAllAsync(filtro, cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var suspensao = await _service.GetByIdAsync(id, cancellationToken);
        if (suspensao is null) return NotFound();
        return Ok(suspensao);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SuspensaoCreateDto dto, CancellationToken cancellationToken)
    {
        var r = await _service.CreateAsync(dto, cancellationToken);
        if (r.Status == SuspensaoStatus.Sucesso)
            return StatusCode(StatusCodes.Status201Created, new SuspensaoCreatedDto(r.Id!.Value));
        return Erro(r);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SuspensaoUpdateDto dto, CancellationToken cancellationToken)
    {
        var r = await _service.UpdateAsync(id, dto, cancellationToken);
        return r.Status == SuspensaoStatus.Sucesso ? Ok() : Erro(r);
    }

    [HttpPatch("{id}/assinatura")]
    public async Task<IActionResult> SetAssinatura(int id, [FromBody] SuspensaoAssinaturaDto dto, CancellationToken cancellationToken)
    {
        var r = await _service.SetAssinaturaAsync(id, dto.Assinada, cancellationToken);
        return r.Status == SuspensaoStatus.Sucesso ? Ok() : Erro(r);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var r = await _service.DeleteAsync(id, cancellationToken);
        return r.Status == SuspensaoStatus.Sucesso ? Ok() : Erro(r);
    }

    private IActionResult Erro(SuspensaoResultDto r)
    {
        var corpo = new SuspensaoErroDto(r.Mensagem ?? "Erro ao processar a suspensao.");
        return r.Status switch
        {
            SuspensaoStatus.NaoEncontrada => NotFound(),
            SuspensaoStatus.Conflito => Conflict(corpo),
            SuspensaoStatus.NaoProcessavel => UnprocessableEntity(corpo),
            _ => BadRequest(corpo)
        };
    }
}
