using Microsoft.AspNetCore.Mvc;
using sys_adivert.Application.Colabs.Dtos;
using sys_adivert.Application.Service;

[ApiController]
[Route("api/[controller]")]
public class ColabsController : ControllerBase
{
    private readonly IColabService _colabService;

    public ColabsController(IColabService colabService)
    {
        _colabService = colabService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var colabs = await _colabService.GetAllAsync();
        return Ok(colabs);
    }

    [HttpGet("matricula")]
    public async Task<IActionResult> GetMatriculaByNome([FromQuery] string nome)
    {
        var matricula = await _colabService.GetMatriculaByNomeAsync(nome);
        if (matricula is null) return NotFound();

        return Ok(new ColabMatriculaDto(nome, matricula));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ColabCreateDto dto)
    {
        bool validacao = await _colabService.CreateAsync(dto);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool validacao = await _colabService.DeleteAsync(id);
        if (validacao == false) return NotFound();
        return Ok();
    }
}
