using Microsoft.AspNetCore.Mvc;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Service;

[ApiController]
[Route("api/[controller]")]
public class AdivertsController : ControllerBase
{
    private readonly IAdivertService _adivertService;

    public AdivertsController(IAdivertService adivertService)
    {
        _adivertService = adivertService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? nome, CancellationToken cancellationToken)
    {
        var adiverts = await _adivertService.GetAllAsync(nome, cancellationToken);
        return Ok(adiverts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var adivert = await _adivertService.GetByIdAsync(id, cancellationToken);
        if (adivert is null) return NotFound();
        return Ok(adivert);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdivertCreateDto dto, CancellationToken cancellationToken)
    {
        bool validacao = await _adivertService.CreateAsync(dto, cancellationToken);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpPost("batch")]
    public async Task<IActionResult> CreateBatch(
        [FromBody] List<AdivertCreateDto>? dtos,
        CancellationToken cancellationToken)
    {
        var resultado = await _adivertService.CreateBatchAsync(dtos, cancellationToken);

        return resultado.Status switch
        {
            AdivertBatchStatus.Sucesso => StatusCode(
                StatusCodes.Status201Created,
                new AdivertBatchCreatedDto(resultado.Ids, resultado.Ids.Count)),

            AdivertBatchStatus.LimiteExcedido => StatusCode(
                StatusCodes.Status413PayloadTooLarge,
                new AdivertBatchErroDto(resultado.Mensagem!, resultado.Erros)),

            AdivertBatchStatus.Conflito => Conflict(
                new AdivertBatchErroDto(resultado.Mensagem!, resultado.Erros)),

            AdivertBatchStatus.NaoProcessavel => UnprocessableEntity(
                new AdivertBatchErroDto(resultado.Mensagem!, resultado.Erros)),

            // ListaVazia / ItensInvalidos
            _ => BadRequest(new AdivertBatchErroDto(resultado.Mensagem!, resultado.Erros))
        };
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdivertUpdateDto dto, CancellationToken cancellationToken)
    {
        bool validacao = await _adivertService.UpdateAsync(id, dto, cancellationToken);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpPatch("{id}/assinatura")]
    public async Task<IActionResult> SetAssinatura(int id, [FromBody] AdivertAssinaturaDto dto, CancellationToken cancellationToken)
    {
        bool validacao = await _adivertService.SetAssinaturaAsync(id, dto.Assinada, cancellationToken);
        if (validacao == false) return NotFound();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        bool validacao = await  _adivertService.DeleteAsync(id, cancellationToken);
        if (validacao == false) return NotFound();
        return Ok();
    }
}
