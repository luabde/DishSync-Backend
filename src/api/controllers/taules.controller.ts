import { Request, Response, NextFunction } from "express";
import { TaulesService } from "../../services/taules.service";

export class TaulesController {
  static getTableTypes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tableTypes = await TaulesService.getTableTypes();
      res.status(200).json(tableTypes);
    } catch (error) {
      next(error);
    }
  };
}
