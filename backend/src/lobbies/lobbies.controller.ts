import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LobbiesService } from './lobbies.service';
import { TeamsService } from '../teams/teams.service';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('lobbies')
@UseGuards(JwtAuthGuard)
export class LobbiesController {
  constructor(
    private lobbies: LobbiesService,
    private teams: TeamsService,
  ) {}

  @Get()
  getOpen() {
    return this.lobbies.findOpen();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.lobbies.findOne(id);
  }

  @Get(':id/players')
  getPlayers(@Param('id') id: string) {
    return this.lobbies.getPlayers(id);
  }

  @Get(':id/teams')
  getTeams(@Param('id') id: string) {
    return this.teams.findByLobby(id);
  }

  @Post()
  @UseGuards(VerifiedGuard)
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateLobbyDto) {
    return this.lobbies.create(u.sub, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() u: JwtPayload) {
    return this.lobbies.publish(id, u.sub);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() u: JwtPayload) {
    return this.lobbies.join(id, u.sub);
  }

  @Post(':id/join/:code')
  joinInvite(
    @Param('id') id: string,
    @Param('code') code: string,
    @CurrentUser() u: JwtPayload,
  ) {
    return this.lobbies.join(id, u.sub, code);
  }

  @Delete(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() u: JwtPayload) {
    return this.lobbies.leave(id, u.sub);
  }

  @Post(':id/kick/:userId')
  kick(
    @Param('id') id: string,
    @Param('userId') target: string,
    @CurrentUser() u: JwtPayload,
  ) {
    return this.lobbies.kick(id, u.sub, target);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() u: JwtPayload) {
    return this.lobbies.cancel(id, u.sub);
  }

  @Patch(':id/teams/:teamId/join')
  joinTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @CurrentUser() u: JwtPayload,
  ) {
    return this.lobbies.joinTeam(id, teamId, u.sub);
  }
}
