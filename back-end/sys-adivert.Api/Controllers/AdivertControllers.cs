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
    public async Task<IActionResult> GetAll([FromQuery] string? nome)
    {
        var adiverts = await _adivertService.GetAllAsync(nome);
        return Ok(adiverts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var adivert = await _adivertService.GetByIdAsync(id);
        if (adivert is null) return NotFound();
        return Ok(adivert);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdivertCreateDto dto)
    {
        bool validacao = await _adivertService.CreateAsync(dto);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdivertUpdateDto dto)
    {
        bool validacao = await _adivertService.UpdateAsync(id, dto);
        if (validacao == false) return BadRequest();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        bool validacao = await  _adivertService.DeleteAsync(id);
        if (validacao == false) return NotFound();
        return Ok();
    }
}