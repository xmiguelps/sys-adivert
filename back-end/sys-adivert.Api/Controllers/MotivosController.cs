using Microsoft.AspNetCore.Mvc;
using sys_adivert.Application.Motivos.Dtos;
using sys_adivert.Application.Service;

[ApiController]
[Route("api/[controller]")]
public class MotivosController : ControllerBase
{
    private readonly IMotivoService _motivoService;

    public MotivosController(IMotivoService motivoService)
    {
        _motivoService = motivoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var motivos = await _motivoService.GetAllAsync();
        return Ok(motivos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MotivoCreateDto dto)
    {
        bool validacao = await _motivoService.CreateAsync(dto);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool validacao = await _motivoService.DeleteAsync(id);
        if (validacao == false) return NotFound();
        return Ok();
    }
}
